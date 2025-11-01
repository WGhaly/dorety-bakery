import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    console.log('DEBUG: Content-Type:', contentType);
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text()
      console.log('DEBUG: Raw text:', text);
      
      const params = new URLSearchParams(text)
      const body = {
        name: params.get('name'),
        email: params.get('email'),
        phone: params.get('phone'),
        password: params.get('password')
      }
      
      console.log('DEBUG: Parsed body:', body);
      
      return NextResponse.json({ 
        success: true, 
        received: body,
        contentType: contentType
      })
    }
    
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })
    
  } catch (error) {
    console.error('DEBUG: Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}