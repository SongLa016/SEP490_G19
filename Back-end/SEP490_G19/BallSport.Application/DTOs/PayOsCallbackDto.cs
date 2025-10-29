using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class PayOsCallbackDto
    {
        public int BookingId { get; set; }        // ID booking cần cập nhật
        public string Status { get; set; }
    }
}
