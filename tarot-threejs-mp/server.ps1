$http = [System.Net.HttpListener]::new()
$http.Prefixes.Add("http://localhost:8080/")
$http.Start()
Write-Host "Server started at http://localhost:8080/"
while ($http.IsListening) {
    $context = $http.GetContext()
    $response = $context.Response
    $localPath = $context.Request.Url.LocalPath
    if ($localPath -eq "/") { $localPath = "/index.html" }
    $filePath = Join-Path (Get-Location) $localPath.TrimStart("/")
    if (Test-Path $filePath -As Leaf) {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        $mime = if ($filePath.EndsWith(".html")) { "text/html" } elseif ($filePath.EndsWith(".js")) { "application/javascript" } else { "text/plain" }
        $response.ContentType = $mime
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    } else {
        $response.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    $response.OutputStream.Close()
}