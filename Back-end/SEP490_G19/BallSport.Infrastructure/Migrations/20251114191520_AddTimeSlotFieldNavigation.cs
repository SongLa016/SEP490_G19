using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BallSport.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeSlotFieldNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            //migrationBuilder.AddColumn<int>(
            //    name: "FieldId",
            //    table: "TimeSlots",
            //    type: "int",
            //    nullable: false,
            //    defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_TimeSlots_FieldId",
                table: "TimeSlots",
                column: "FieldId");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeSlots_Fields_FieldId",
                table: "TimeSlots",
                column: "FieldId",
                principalTable: "Fields",
                principalColumn: "FieldID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeSlots_Fields_FieldId",
                table: "TimeSlots");

            migrationBuilder.DropIndex(
                name: "IX_TimeSlots_FieldId",
                table: "TimeSlots");

            migrationBuilder.DropColumn(
                name: "FieldId",
                table: "TimeSlots");
            migrationBuilder.DropIndex(
                name: "UQ_TimeSlot_FieldTime",
                table: "TimeSlots");


            migrationBuilder.CreateIndex(
                name: "UQ_TimeSlot_FieldTime",
                table: "TimeSlots",
                columns: new[] { "FieldId", "StartTime", "EndTime" },
                unique: true);
        }
    }
}
