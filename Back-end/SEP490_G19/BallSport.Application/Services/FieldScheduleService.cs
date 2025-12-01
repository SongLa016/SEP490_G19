using System;
using BallSport.Application;
using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using BallSport.Application.Services;

public interface IFieldScheduleService
{
    // OWNER CRUD
    Task<FieldScheduleDTO> AddAsync(FieldScheduleDTO dto, int ownerId);
    Task<FieldScheduleDTO?> UpdateAsync(int id, FieldScheduleDTO dto, int ownerId);
    Task<bool> DeleteAsync(int id, int ownerId);
    Task<List<FieldScheduleDTO>> GetAllAsync(int ownerId);
    Task<FieldScheduleDTO?> GetByIdAsync(int id, int ownerId);

    // PUBLIC
    Task<List<FieldSchedulePublicDTO>> GetPublicAllAsync();
    Task<FieldSchedulePublicDTO?> GetPublicByIdAsync(int scheduleId);
    Task<List<FieldScheduleDTO>> GetPublicByFieldAsync(int fieldId);
}
public class FieldScheduleService : IFieldScheduleService
{
    private readonly Sep490G19v1Context _context;
    private readonly IFieldScheduleRepository _repo;

    public FieldScheduleService(Sep490G19v1Context context, IFieldScheduleRepository repo)
    {
        _context = context;
        _repo = repo;
    }

    // ------------------------ OWNER CRUD -------------------------------

    public async Task<FieldScheduleDTO> AddAsync(FieldScheduleDTO dto, int ownerId)
    {
        if (dto.FieldId == null || dto.SlotId == null)
            throw new Exception("FieldId và SlotId là bắt buộc.");

        // Check owner quyền
        var field = await _context.Fields
            .Include(f => f.Complex)
            .FirstOrDefaultAsync(f => f.FieldId == dto.FieldId && f.Complex.OwnerId == ownerId);

        if (field == null)
            throw new UnauthorizedAccessException("Bạn không có quyền thêm lịch cho sân này.");

        var slot = await _context.TimeSlots.FirstOrDefaultAsync(s => s.SlotId == dto.SlotId);
        if (slot == null)
            throw new Exception("Slot không tồn tại.");

        // Check trùng / chồng lấn slot
        bool overlap = await _context.FieldSchedules
            .Where(fs => fs.FieldId == dto.FieldId && fs.Date == dto.Date)
            .AnyAsync(fs =>
                fs.SlotId == dto.SlotId ||
                (fs.Slot!.StartTime < slot.EndTime && fs.Slot.EndTime > slot.StartTime)
            );

        if (overlap)
            throw new Exception("Khung giờ này đã tồn tại hoặc chồng lấn.");

        var schedule = new FieldSchedule
        {
            FieldId = dto.FieldId,
            SlotId = dto.SlotId,
            Date = dto.Date,
            Status = dto.Status ?? "Available"
        };

        var created = await _repo.AddAsync(schedule);

        return new FieldScheduleDTO
        {
            ScheduleId = created.ScheduleId,
            FieldId = created.FieldId,
            FieldName = field.Name,
            SlotId = created.SlotId,
            SlotName = slot.SlotName,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            Date = created.Date,
            Status = created.Status
        };
    }

    public async Task<FieldScheduleDTO?> UpdateAsync(int id, FieldScheduleDTO dto, int ownerId)
    {
        var schedule = await _repo.GetByIdAsync(id);
        if (schedule == null) return null;

        var field = await _context.Fields
            .Include(f => f.Complex)
            .FirstOrDefaultAsync(f => f.FieldId == schedule.FieldId && f.Complex.OwnerId == ownerId);

        if (field == null)
            throw new UnauthorizedAccessException("Bạn không có quyền sửa lịch của sân này.");

        var slot = await _context.TimeSlots.FirstOrDefaultAsync(s => s.SlotId == dto.SlotId);
        if (slot == null)
            throw new Exception("Slot không tồn tại.");

        bool overlap = await _context.FieldSchedules
            .Where(fs => fs.FieldId == schedule.FieldId && fs.Date == dto.Date && fs.ScheduleId != id)
            .AnyAsync(fs =>
                fs.SlotId == dto.SlotId ||
                (fs.Slot!.StartTime < slot.EndTime && fs.Slot.EndTime > slot.StartTime)
            );

        if (overlap)
            throw new Exception("Khung giờ mới đã tồn tại hoặc chồng lấn.");

        schedule.SlotId = dto.SlotId;
        schedule.Date = dto.Date;
        schedule.Status = dto.Status ?? schedule.Status;

        await _repo.UpdateAsync(schedule);

        return new FieldScheduleDTO
        {
            ScheduleId = schedule.ScheduleId,
            FieldId = schedule.FieldId,
            FieldName = field.Name,
            SlotId = slot.SlotId,
            SlotName = slot.SlotName,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            Date = schedule.Date,
            Status = schedule.Status
        };
    }

    public async Task<bool> DeleteAsync(int id, int ownerId)
    {
        var schedule = await _repo.GetByIdAsync(id);
        if (schedule == null) return false;

        var field = await _context.Fields
            .Include(f => f.Complex)
            .FirstOrDefaultAsync(f => f.FieldId == schedule.FieldId && f.Complex.OwnerId == ownerId);

        if (field == null)
            throw new UnauthorizedAccessException("Bạn không có quyền xóa lịch của sân này.");

        await _repo.DeleteAsync(schedule);
        return true;
    }

    public async Task<List<FieldScheduleDTO>> GetAllAsync(int ownerId)
    {
        var schedules = await _context.FieldSchedules
            .Include(fs => fs.Field)
            .Include(fs => fs.Slot)
            .Where(fs => fs.Field!.Complex.OwnerId == ownerId)
            .OrderBy(fs => fs.Date)
            .ThenBy(fs => fs.Slot!.StartTime)
            .ToListAsync();

        return schedules.Select(fs => new FieldScheduleDTO
        {
            ScheduleId = fs.ScheduleId,
            FieldId = fs.FieldId,
            FieldName = fs.Field!.Name,
            SlotId = fs.SlotId,
            SlotName = fs.Slot!.SlotName,
            StartTime = fs.Slot.StartTime,
            EndTime = fs.Slot.EndTime,
            Date = fs.Date,
            Status = fs.Status
        }).ToList();
    }

    public async Task<FieldScheduleDTO?> GetByIdAsync(int id, int ownerId)
    {
        var schedule = await _context.FieldSchedules
            .Include(fs => fs.Field)
            .Include(fs => fs.Slot)
            .FirstOrDefaultAsync(fs => fs.ScheduleId == id && fs.Field!.Complex.OwnerId == ownerId);

        if (schedule == null) return null;

        return new FieldScheduleDTO
        {
            ScheduleId = schedule.ScheduleId,
            FieldId = schedule.FieldId,
            FieldName = schedule.Field!.Name,
            SlotId = schedule.SlotId,
            SlotName = schedule.Slot!.SlotName,
            StartTime = schedule.Slot.StartTime,
            EndTime = schedule.Slot.EndTime,
            Date = schedule.Date,
            Status = schedule.Status
        };
    }

    // ==================================================================
    // ---------------------- PUBLIC CHO NGƯỜI CHƠI ----------------------
    // ==================================================================

    public async Task<List<FieldSchedulePublicDTO>> GetPublicAllAsync()
    {
        return await _context.FieldSchedules
            .Include(s => s.Field)
            .Include(s => s.Slot)
            .Select(s => new FieldSchedulePublicDTO
            {
                ScheduleID = s.ScheduleId,
                FieldID = s.FieldId,
                Date = s.Date,
                Status = s.Status,
                StartTime = s.Slot.StartTime,
                EndTime = s.Slot.EndTime
            })
            .ToListAsync();
    }

    public async Task<FieldSchedulePublicDTO?> GetPublicByIdAsync(int scheduleId)
    {
        return await _context.FieldSchedules
            .Include(s => s.Field)
            .Include(s => s.Slot)
            .Where(s => s.ScheduleId == scheduleId)
            .Select(s => new FieldSchedulePublicDTO
            {
                ScheduleID = s.ScheduleId,
                FieldID = s.FieldId,
                Date = s.Date,
                Status = s.Status,
                StartTime = s.Slot.StartTime,
                EndTime = s.Slot.EndTime
            })
            .FirstOrDefaultAsync();
    }

    public async Task<List<FieldScheduleDTO>> GetPublicByFieldAsync(int fieldId)
    {
        var schedules = await _context.FieldSchedules
            .Include(fs => fs.Field)
            .Include(fs => fs.Slot)
            .Where(fs => fs.FieldId == fieldId)
            .OrderBy(fs => fs.Date)
            .ThenBy(fs => fs.Slot.StartTime)
            .ToListAsync();

        return schedules.Select(fs => new FieldScheduleDTO
        {
            ScheduleId = fs.ScheduleId,
            FieldId = fs.FieldId,
            FieldName = fs.Field!.Name,
            SlotId = fs.SlotId,
            SlotName = fs.Slot!.SlotName,
            StartTime = fs.Slot.StartTime,
            EndTime = fs.Slot.EndTime,
            Date = fs.Date,
            Status = fs.Status
        }).ToList();
    }
}
