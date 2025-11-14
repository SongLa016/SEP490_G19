using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace BallSport.Application.DTOs
{
    public class FieldImageDTO
    {
        public int FieldId { get; set; }
        public List<IFormFile> Images { get; set; } = new List<IFormFile>();
    }
}
