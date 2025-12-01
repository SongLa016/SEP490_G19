using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

public interface IFieldPriceService
{
    Task<List<FieldPrice>> GetAllAsync(int ownerId);
    Task<FieldPrice?> GetByIdAsync(int ownerId, int priceId);

    // Thay đổi return type từ Task → Task<FieldPrice>
    Task<FieldPrice> AddAsync(int ownerId, FieldPriceDTO dto);

    Task UpdateAsync(int ownerId, int priceId, FieldPriceDTO dto);
    Task DeleteAsync(int ownerId, int priceId);
}

public class FieldPriceService : IFieldPriceService
{
    private readonly IFieldPriceRepository _repository;
    private readonly Sep490G19v1Context _context;

    public FieldPriceService(IFieldPriceRepository repository, Sep490G19v1Context context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<List<FieldPrice>> GetAllAsync(int ownerId)
    {
        var all = await _repository.GetAllAsync();
        return all.Where(fp => fp.Field?.Complex?.OwnerId == ownerId).ToList();
    }

    public async Task<FieldPrice?> GetByIdAsync(int ownerId, int priceId)
    {
        var fp = await _repository.GetByIdAsync(priceId);
        if (fp == null || fp.Field?.Complex?.OwnerId != ownerId)
            return null;
        return fp;
    }

    public async Task<FieldPrice> AddAsync(int ownerId, FieldPriceDTO dto)
    {
        var field = await _context.Fields
            .Include(f => f.Complex)
            .FirstOrDefaultAsync(f => f.FieldId == dto.FieldId);

        if (field == null)
            throw new Exception("Field not found");
        if (field.Complex?.OwnerId != ownerId)
            throw new UnauthorizedAccessException("Bạn không có quyền trên Field này");

        var entity = new FieldPrice
        {
            FieldId = dto.FieldId,
            SlotId = dto.SlotId,
            Price = dto.Price
        };

        await _repository.AddAsync(entity);
        return entity;
    }


    public async Task UpdateAsync(int ownerId, int priceId, FieldPriceDTO dto)
    {
        var entity = await _repository.GetByIdAsync(priceId);
        if (entity == null)
            throw new Exception("FieldPrice not found");

        if (entity.Field?.Complex?.OwnerId != ownerId)
            throw new UnauthorizedAccessException("Bạn không có quyền trên Field này");

        entity.FieldId = dto.FieldId;
        entity.SlotId = dto.SlotId;
        entity.Price = dto.Price;

        await _repository.UpdateAsync(entity);
    }

    public async Task DeleteAsync(int ownerId, int priceId)
    {
        var entity = await _repository.GetByIdAsync(priceId);
        if (entity == null)
            throw new Exception("FieldPrice not found");

        if (entity.Field?.Complex?.OwnerId != ownerId)
            throw new UnauthorizedAccessException("Bạn không có quyền trên Field này");

        await _repository.DeleteAsync(entity);
    }
}
