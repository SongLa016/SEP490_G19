using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs.RatingBooking
{
    public class RatingDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int Stars { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        // Thêm Replies để chứa phản hồi
        public List<RatingReplyDto> Replies { get; set; } = new List<RatingReplyDto>();
    }

}
