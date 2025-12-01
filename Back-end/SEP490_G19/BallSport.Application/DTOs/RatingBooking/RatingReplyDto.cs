using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs.RatingBooking
{
    public class RatingReplyDto
    {
        public int ReplyId { get; set; }
        public int RatingId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string ReplyText { get; set; }
        public DateTime CreatedAt { get; set; }
    }

}
