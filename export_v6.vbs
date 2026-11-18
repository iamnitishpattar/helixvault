
Set w = CreateObject("Word.Application")
w.Visible = False
Set doc = w.Documents.Open("e:\new_project_main\HelixVault_IEEE_Paper_v6.docx", False, True)
doc.SaveAs "e:\new_project_main\HelixVault_IEEE_Paper_v6.pdf", 17
WScript.Echo "Total pages: " & doc.ComputeStatistics(2)
doc.Close False
w.Quit
