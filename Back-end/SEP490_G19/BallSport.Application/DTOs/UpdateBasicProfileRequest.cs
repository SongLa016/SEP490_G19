using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace BallSport.Application.DTOs
{
    public class UpdateBasicProfileRequest
    {

        public string FullName { get; set; } = null!;
        public IFormFile? Avatar { get; set; }
    }
}
