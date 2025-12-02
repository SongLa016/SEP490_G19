using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs.StatisticPlayer
{
    public class PlayerActivityDto
    {
        public string Description { get; set; } = null!; // Ví dụ: "Đặt sân ABC - 19:00 ngày 1/12"
        public string RelativeTime { get; set; } = null!; // Ví dụ: "2 giờ trước"
    }

}
