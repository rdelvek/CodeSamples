using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Excel = Microsoft.Office.Interop.Excel;

namespace Scorecard_YearEnd_Summary
{


    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }


        private void button1_Click_1(object sender, EventArgs e)
        {
            // initiate new Excel Application
            Excel.Application excelApp = new Excel.Application();

            // we dont want it to open Excel just run in the background
            excelApp.Visible = false;

            // open the XLSX file
            Excel.Workbook excelWorkbook = this.openWorkBook(excelApp, "Book1.xlsx");

            // open all the tabs (sheets) into memory
            Excel.Sheets excelSheets = excelWorkbook.Worksheets;

            // create new list of cells we will be pulling data from
            List<CellReferences> cellReferences = new List<CellReferences>();
            cellReferences.Add(new CellReferences("A1", "this is a test"));
            cellReferences.Add(new CellReferences("A2", "this is a sample"));
            cellReferences.Add(new CellReferences("A3", "this is a new example"));
            
            // open the sheet we are starting with
            Excel.Worksheet startingSheet = (Excel.Worksheet)excelSheets.get_Item("Sheet3");

            // open the final results sheet
            Excel.Worksheet resultsSheet = (Excel.Worksheet)excelSheets.get_Item("Final");

            // erase all columns in final sheet
            resultsSheet.Range["A1", "IU1000"].Delete();

            // creates the column headers on results page
            this.createResultsHeader(resultsSheet, cellReferences);

            // we will be adding the dynamic data starting on row 2
            var row = 2;

            // assign the current sheet to the first sheet before looping
            var CurrentSheet = startingSheet;

            // here we need to loop through and write the data to the file
            while (CurrentSheet.Next != null)
            {
                var column = 1;

                foreach (var cell in cellReferences)
                {
                    resultsSheet.Cells[row, column] = this.getCellValue(CurrentSheet, cell.CellReference);
                    column++;
                }

                row++;
                CurrentSheet = CurrentSheet.Next;

            } 

            // save the XLSX file
            excelWorkbook.Save();

            // close the XLSX file
            excelWorkbook.Close();

            // quit the app
            excelApp.Quit();

            // show the "complete" message
            label1.Show();
        }


        // this will create the first row of the results worksheet
        private void createResultsHeader(Excel.Worksheet resultsSheet, List<CellReferences> cellReferences)
        {
            var row = 1;
            var column = 1;

            foreach (var cell in cellReferences)
            {
                resultsSheet.Cells[row, column] = cell.Description;
                column++;
            }
        }


        // this private method simply gets the value from the passed cell number
        private Excel.Range getCellValue(Excel.Worksheet ws, string cell_number)
        {
            return (Excel.Range)ws.get_Range(cell_number, cell_number); 
        }


        // opens an excel file
        private Excel.Workbook openWorkBook(Excel.Application excelApp, string path)
        {
            return excelApp.Workbooks.Open(
                                            path,
                                            0,
                                            false,
                                            5,
                                            "",
                                            "",
                                            false,
                                            Excel.XlPlatform.xlWindows,
                                            "",
                                            true,
                                            false,
                                            0,
                                            true,
                                            false,
                                            false
            );
        }

        private void label1_Click(object sender, EventArgs e)
        {

        }


    }


    // this is the class I wrote to create the objects for the cell references and descriptions
    public class CellReferences
    {
        public string CellReference;
        public string Description;

        public CellReferences(string CellReference, string Description)
        {
            this.CellReference = CellReference;
            this.Description = Description;
        }

    }
}
