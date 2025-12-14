using System;
using BallSport.Application.DTOs;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

public interface IFieldTypeService
{
    Task<List<FieldTypeReadDTO>> GetAllAsync();
    Task<FieldTypeReadDTO?> GetByIdAsync(int typeId);
}

public class FieldTypeService : IFieldTypeService
{
    private readonly IFieldTypeRepository _repo;
    private readonly Sep490G19v1Context _context;

    public FieldTypeService(IFieldTypeRepository repo, Sep490G19v1Context context)
    {
        _repo = repo;
        _context = context;
    }

    public async Task<List<FieldTypeReadDTO>> GetAllAsync()
    {
        var list = await _repo.GetAllAsync();
        return list.Select(ft => new FieldTypeReadDTO
        {
            TypeId = ft.TypeId,
            TypeName = ft.TypeName
        }).ToList();
    }

    public async Task<FieldTypeReadDTO?> GetByIdAsync(int typeId)
    {
        var ft = await _repo.GetByIdAsync(typeId);
        if (ft == null) return null;
        return new FieldTypeReadDTO
        {
            TypeId = ft.TypeId,
            TypeName = ft.TypeName
        };
    }
}
