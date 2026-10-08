<?php

$host     = "localhost";
$usuario  = "root";        
$password = "";            
$base     = "trae_db";

$conn = new mysqli($host, $usuario, $password, $base);

/* Si falla la conexión, mostrar error */
if ($conn->connect_error) {
    die(json_encode([
        "estado"  => "error",
        "mensaje" => "Error de conexión: " . $conn->connect_error
    ]));
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: registro.html");
    exit;
}

function limpiar($conn, $dato) {
    return $conn->real_escape_string(htmlspecialchars(trim($dato)));
}

$nombre        = limpiar($conn, $_POST["nombre"]        ?? "");
$apellido      = limpiar($conn, $_POST["apellido"]      ?? "");
$cedula        = limpiar($conn, $_POST["cedula"]        ?? "");
$fecha_nac     = limpiar($conn, $_POST["fecha_nac"]     ?? "");
$grado         = limpiar($conn, $_POST["grado"]         ?? "");
$ruta          = limpiar($conn, $_POST["ruta"]          ?? "");
$telefono      = limpiar($conn, $_POST["telefono"]      ?? "");
$tel_emergencia= limpiar($conn, $_POST["tel_emergencia"]?? "");
$direccion     = limpiar($conn, $_POST["direccion"]     ?? "");
$correo        = limpiar($conn, $_POST["correo"]        ?? "");
$contrasena    = password_hash($_POST["contrasena"] ?? "", PASSWORD_DEFAULT); // Encriptada

$check = $conn->query("SELECT id FROM estudiantes WHERE correo = '$correo'");
if ($check->num_rows > 0) {
    header("Location: registro.html?error=correo_duplicado");
    exit;
}

$sql = "INSERT INTO estudiantes 
        (nombre, apellido, cedula, fecha_nac, grado, ruta, telefono, tel_emergencia, direccion, correo, contrasena)
        VALUES 
        ('$nombre','$apellido','$cedula','$fecha_nac','$grado','$ruta','$telefono','$tel_emergencia','$direccion','$correo','$contrasena')";

if ($conn->query($sql) === TRUE) {
    /* Redirigir a página de éxito */
    header("Location: registro_exitoso.html");
} else {
    /* Redirigir con error */
    header("Location: registro.html?error=db_error");
}

$conn->close();
?>