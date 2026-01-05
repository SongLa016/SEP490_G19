using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class UpdateBasicProfileDto
    {
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? Phone { get; set; }

    }
}
