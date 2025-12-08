using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs.AISeoContent
{
    public class AiPostListDto
    {
        public int PostId { get; set; }
        public string? Title { get; set; }
        public string? Slug { get; set; }
        public string? SeoDescription { get; set; }
        public string? Type { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

}
