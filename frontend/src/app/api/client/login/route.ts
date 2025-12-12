import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "E-mail e senha são obrigatórios." },
        { status: 400 },
      );
    }

    // TODO: Integrar com autenticação real (banco, FastAPI, etc.)
    // Por enquanto, apenas aceitamos o login e retornamos sucesso.
    return NextResponse.json({
      success: true,
      message: "Login recebido. Área do cliente em breve.",
    });
  } catch (error) {
    console.error("Erro no endpoint de login da área do cliente:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao processar o login." },
      { status: 500 },
    );
  }
}


