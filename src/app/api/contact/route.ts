import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Lütfen tüm alanları doldurun." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "beydanur.pinarbasi@gmail.com", // Alıcı e-posta adresi
      subject: `Yeni İletişim Formu Mesajı - ${name}`,
      text: `Gönderen: ${name} (${email})\n\nMesaj:\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: "E-posta başarıyla gönderildi!" }, { status: 200 });
  } catch (error) {
    console.error("E-posta gönderme hatası:", error);
    return NextResponse.json({ error: "E-posta gönderme başarısız." }, { status: 500 });
  }
  
}
