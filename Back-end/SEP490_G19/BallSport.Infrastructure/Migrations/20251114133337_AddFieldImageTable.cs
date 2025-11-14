using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BallSport.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFieldImageTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FieldImage_Fields_FieldId",
                table: "FieldImage");

            migrationBuilder.DropPrimaryKey(
                name: "PK_FieldImage",
                table: "FieldImage");

            migrationBuilder.RenameTable(
                name: "FieldImage",
                newName: "FieldImages");

            migrationBuilder.RenameColumn(
                name: "ImageData",
                table: "FieldImages",
                newName: "Image");

            migrationBuilder.RenameColumn(
                name: "FieldImageId",
                table: "FieldImages",
                newName: "ImageId");

            migrationBuilder.RenameIndex(
                name: "IX_FieldImage_FieldId",
                table: "FieldImages",
                newName: "IX_FieldImages_FieldId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_FieldImages",
                table: "FieldImages",
                column: "ImageId");

            migrationBuilder.AddForeignKey(
                name: "FK_FieldImages_Fields_FieldId",
                table: "FieldImages",
                column: "FieldId",
                principalTable: "Fields",
                principalColumn: "FieldID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FieldImages_Fields_FieldId",
                table: "FieldImages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_FieldImages",
                table: "FieldImages");

            migrationBuilder.RenameTable(
                name: "FieldImages",
                newName: "FieldImage");

            migrationBuilder.RenameColumn(
                name: "Image",
                table: "FieldImage",
                newName: "ImageData");

            migrationBuilder.RenameColumn(
                name: "ImageId",
                table: "FieldImage",
                newName: "FieldImageId");

            migrationBuilder.RenameIndex(
                name: "IX_FieldImages_FieldId",
                table: "FieldImage",
                newName: "IX_FieldImage_FieldId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_FieldImage",
                table: "FieldImage",
                column: "FieldImageId");

            migrationBuilder.AddForeignKey(
                name: "FK_FieldImage_Fields_FieldId",
                table: "FieldImage",
                column: "FieldId",
                principalTable: "Fields",
                principalColumn: "FieldID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
