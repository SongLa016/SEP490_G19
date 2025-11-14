using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BallSport.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFieldImagesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FieldImages",
                columns: table => new
                {
                    ImageId = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FieldId = table.Column<int>(nullable: false),
                    Image = table.Column<byte[]>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldImages", x => x.ImageId);
                    table.ForeignKey(
                        name: "FK_FieldImages_Fields_FieldId",
                        column: x => x.FieldId,
                        principalTable: "Fields",
                        principalColumn: "FieldId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FieldImages_FieldId",
                table: "FieldImages",
                column: "FieldId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FieldImages");
        }

    }
}
