import { createClient } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';

const getDbClient = async () => {
  const client = createClient();
  await client.connect();
  return client;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');
  
  if (!memberId) return NextResponse.json({ error: 'Member ID required' }, { status: 400 });

  try {
    const client = await getDbClient();
    const { rows } = await client.query(
      'SELECT * FROM my_vision_board_items WHERE memberstack_id = $1 ORDER BY z_index ASC',
      [memberId]
    );

    const response = NextResponse.json(rows);
    response.headers.set('Cache-Control', 'no-store');
    await client.end();
    return response;
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: 'Failed to load vision board', details: error?.toString() }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      memberstack_id, 
      team_id,
      image_url, 
      x_position, 
      y_position, 
      width, 
      height, 
      z_index,
      text,
      text_color,
      background_color,
      is_bold,
      text_align
    } = body;
    
    if (!memberstack_id) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }
    
    let finalImageUrl = image_url;
    if (image_url.startsWith('data:image')) {
      const base64Data = image_url.split(',')[1];
      const blob = Buffer.from(base64Data, 'base64');
      const { url } = await put(`my-vision-board/${memberstack_id}/${Date.now()}.jpg`, blob, { 
        access: 'public',
        addRandomSuffix: true
      });
      finalImageUrl = url;
    }

    const client = await getDbClient();
    const { rows } = await client.query(
      `INSERT INTO my_vision_board_items (
        memberstack_id, 
        team_id,
        image_url, 
        x_position, 
        y_position, 
        width, 
        height, 
        z_index,
        text,
        text_color,
        background_color,
        is_bold,
        text_align
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        memberstack_id, 
        team_id || null,
        finalImageUrl, 
        x_position || 0, 
        y_position || 0, 
        width || 300, 
        height || 200, 
        z_index || 1,
        text || null,
        text_color || '#FFFFFF',
        background_color || 'rgba(0, 0, 0, 0.7)',
        is_bold || false,
        text_align || 'center'
      ]
    );

    const response = NextResponse.json(rows[0]);
    response.headers.set('Cache-Control', 'no-store');
    await client.end();
    return response;
  } catch (err) {
    console.error('Error details:', err);
    return NextResponse.json({ error: 'Failed to save item', details: err?.toString() }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, 
      memberstack_id, 
      team_id,
      image_url, 
      x_position, 
      y_position, 
      width, 
      height, 
      z_index,
      text,
      text_color,
      background_color,
      is_bold,
      text_align
    } = body;

    if (!id || !memberstack_id) {
      return NextResponse.json({ error: 'ID and Member ID required' }, { status: 400 });
    }

    const client = await getDbClient();
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    // Handle base64 image if present
    let finalImageUrl = image_url;
    if (image_url && image_url.startsWith('data:image')) {
      const base64Data = image_url.split(',')[1];
      const blob = Buffer.from(base64Data, 'base64');
      const { url } = await put(
        `my-vision-board/${memberstack_id}/${Date.now()}.jpg`, 
        blob, 
        { access: 'public' }
      );
      finalImageUrl = url;
    }

    const fieldsToUpdate: Record<string, any> = {
      image_url: finalImageUrl,
      team_id,
      x_position, 
      y_position, 
      width, 
      height, 
      z_index, 
      text,
      text_color,
      background_color,
      is_bold,
      text_align
    };

    for (const [key, value] of Object.entries(fieldsToUpdate)) {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id, memberstack_id);

    const query = `
      UPDATE my_vision_board_items 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount++} AND memberstack_id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await client.query(query, values);
    await client.end();

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const response = NextResponse.json(rows[0]);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: 'Failed to update item', details: error?.toString() }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const memberstack_id = searchParams.get('memberId');
  
  if (!id || !memberstack_id) {
    return NextResponse.json({ error: 'ID and Member ID required' }, { status: 400 });
  }

  try {
    const client = await getDbClient();
    
    // First get the image URL before deleting
    const { rows: itemRows } = await client.query(
      'SELECT image_url FROM my_vision_board_items WHERE id = $1 AND memberstack_id = $2',
      [id, memberstack_id]
    );

    if (itemRows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete from database
    await client.query(
      'DELETE FROM my_vision_board_items WHERE id = $1 AND memberstack_id = $2',
      [id, memberstack_id]
    );
    
    await client.end();

    // If image is in Vercel Blob storage (URL contains specific pattern)
    const imageUrl = itemRows[0].image_url;
    if (imageUrl.includes('vercel.blob.core.windows.net')) {
      try {
        // Delete from blob storage
        await del(imageUrl);
      } catch (blobError) {
        console.error('Failed to delete from blob storage:', blobError);
        // Continue even if blob deletion fails
      }
    }

    const response = NextResponse.json({ success: true });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: 'Failed to delete item', details: error?.toString() }, { status: 500 });
  }
}
