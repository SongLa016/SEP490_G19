using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs.RatingBooking
{
    public class CreateReplyRequest
    {
        public int RatingId { get; set; }
        public string ReplyText { get; set; }
    }

}
