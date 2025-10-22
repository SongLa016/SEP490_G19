using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class UserProfileDTO
    {
        public string DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? PreferredPositions { get; set; }
        public string? SkillLevel { get; set; }
        public string? Bio { get; set; }
    }
}
