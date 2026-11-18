$docxPath = "C:\Users\Nitish Pattar\Desktop\HelixVault_IEEE_Paper_TechRxiv.docx"
$pdfPath = "C:\Users\Nitish Pattar\Desktop\HelixVault_IEEE_Paper_TechRxiv.pdf"
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Open($docxPath)
    $doc.SaveAs([ref]$pdfPath, [ref]17)
    $pageCount = $doc.ComputeStatistics(2)
    $doc.Close([ref]$false)
    $word.Quit()
    Write-Host "PDF_SUCCESS: $pdfPath | Pages: $pageCount"
} catch {
    Write-Host "PDF_ERROR: $_"
}
