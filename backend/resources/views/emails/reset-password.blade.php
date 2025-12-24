<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
        }
        .content {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #2563eb;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Password</h1>
        </div>
        
        <div class="content">
            <p>Halo <strong>{{ $name }}</strong>,</p>
            
            <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah ini untuk melanjutkan proses reset password:</p>
            
            <center>
                <a href="{{ $resetLink }}" class="button">Reset Password</a>
            </center>
            
            <p>Atau copy dan paste link berikut ke browser Anda:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px;">
                {{ $resetLink }}
            </p>
            
            <div class="warning">
                <strong>⚠️ Perhatian:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Link ini hanya berlaku selama <strong>24 jam</strong></li>
                    <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
                    <li>Password lama Anda masih dapat digunakan sampai Anda membuat password baru</li>
                </ul>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                <strong>Catatan untuk user SIMAK:</strong><br>
                Reset password ini hanya berlaku untuk sistem ini. Password Anda di SIMAK tidak akan berubah.
            </p>
        </div>
        
        <div class="footer">
            <p>Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
            <p>&copy; {{ date('Y') }} {{ env('APP_NAME') }}. </p>
        </div>
    </div>
</body>
</html>