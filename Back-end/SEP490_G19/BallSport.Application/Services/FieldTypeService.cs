using System;
using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

public interface IFieldTypeService
{
    Task<List<FieldTypeReadDTO>> GetAllAsync();
    Task<FieldTypeReadDTO?> GetByIdAsync(int typeId);
    Task<FieldTypeReadDTO> CreateAsync(FieldTypeDTO dto, int ownerId);
    Task<FieldTypeReadDTO?> UpdateAsync(int typeId, FieldTypeDTO dto, int ownerId);
    Task DeleteAsync(int typeId, int ownerId);
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

    public async Task<FieldTypeReadDTO> CreateAsync(FieldTypeDTO dto, int ownerId)
    {
        // Owner check: chỉ cho phép thêm kiểu sân nếu owner có ít nhất 1 sân
        var ownsField = await _context.Fields
            .Include(f => f.Complex)
            .AnyAsync(f => f.Complex.OwnerId == ownerId);

        if (!ownsField)
            throw new UnauthorizedAccessException("Bạn không có quyền thêm kiểu sân.");

        var entity = new FieldType { TypeName = dto.TypeName };
        await _repo.AddAsync(entity);

        return new FieldTypeReadDTO
        {
            TypeId = entity.TypeId,
            TypeName = entity.TypeName
        };
    }

    public async Task<FieldTypeReadDTO?> UpdateAsync(int typeId, FieldTypeDTO dto, int ownerId)
    {
        var entity = await _repo.GetByIdAsync(typeId);
        if (entity == null) return null;

        // Owner check: chỉ update nếu có sân thuộc type này mà owner sở hữu
        var ownsField = await _context.Fields
            .Include(f => f.Complex)
            .AnyAsync(f => f.TypeId == typeId && f.Complex.OwnerId == ownerId);

        if (!ownsField)
            throw new UnauthorizedAccessException("Bạn không có quyền sửa kiểu sân này.");

        entity.TypeName = dto.TypeName;
        await _repo.UpdateAsync(entity);

        return new FieldTypeReadDTO
        {
            TypeId = entity.TypeId,
            TypeName = entity.TypeName
        };
    }

    public async Task DeleteAsync(int typeId, int ownerId)
    {
        var entity = await _repo.GetByIdAsync(typeId);
        if (entity == null) return;

        var ownsField = await _context.Fields
            .Include(f => f.Complex)
            .AnyAsync(f => f.TypeId == typeId && f.Complex.OwnerId == ownerId);

        if (!ownsField)
            throw new UnauthorizedAccessException("Bạn không có quyền xóa kiểu sân này.");

        await _repo.DeleteAsync(entity);
    }
}
