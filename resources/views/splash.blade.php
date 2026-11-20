<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin:0; height:100vh; display:flex; flex-direction:column;
           align-items:center; justify-content:center;
           background:#17324D; color:#fff; font-family:Inter,sans-serif; }
    .spin { width:36px; height:36px; border:4px solid #ffffff33;
            border-top-color:#247A73; border-radius:50%;
            animation:s 1s linear infinite; margin-top:20px; }
    @keyframes s { to { transform:rotate(360deg); } }
  </style>
</head>
<body>
  <h2>Personal Teacher Assistant</h2>
  <div>Loading your workspace…</div>
  <div class="spin"></div>
</body>
</html>