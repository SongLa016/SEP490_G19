using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class RegisterDTO
    {
        public string Email { get; set; }
        public string FullName { get; set; }
        public string RoleName { get; set; } 
        public string Password { get; set; }
        public string Phone { get; set; }
        public IFormFile Avatar { get; set; }
    }
}
