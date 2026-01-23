import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAllComplexesWithFields,
} from "../../../../shared/services/fields";
import { fetchTimeSlots } from "../../../../shared/services/timeSlots";
import { fetchOwnerBankAccounts } from "../../../../shared/services/ownerBankAccount";

export const useFieldData = (currentUserId, isDemo = false, apiFieldTypes = []) => {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [complexes, setComplexes] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Mapping kích thước theo loại sân
  const getSizeByTypeName = (typeName) => {
    if (!typeName) return "";
    const name = typeName.toLowerCase();
    if (name.includes("5") || name.includes("năm")) return "25m x 15m";
    if (name.includes("7") || name.includes("bảy")) return "50m x 35m";
    if (name.includes("11") || name.includes("mười một")) return "105m x 68m";
    if (name.includes("9") || name.includes("chín")) return "75m x 55m";
    return "";
  };

  // loại sân - sử dụng useMemo để tránh tính toán lại không cần thiết
  const fieldTypes = useMemo(() => {
    return apiFieldTypes.map(type => {
      const typeName = type.typeName || type.TypeName;
      return {
        value: String(type.typeId || type.TypeID),
        label: typeName,
        typeId: type.typeId || type.TypeID,
        size: getSizeByTypeName(typeName)
      };
    });
  }, [apiFieldTypes]);

  // map để dễ truy xuất typeId
  const fieldTypeMap = useMemo(() => {
    const map = {};
    apiFieldTypes.forEach(type => {
      const typeId = type.typeId || type.TypeID;
      map[String(typeId)] = typeId;
    });
    return map;
  }, [apiFieldTypes]);

  // đếm số sân trong mỗi khu sân
  const complexFieldCounts = useMemo(() => {
    return fields.reduce((acc, field) => {
      acc[field.complexId] = (acc[field.complexId] || 0) + 1;
      return acc;
    }, {});
  }, [fields]);

  // Lọc chỉ hiển thị sân nhỏ của khu sân đã được duyệt (Active)
  const activeFields = useMemo(() => {
    return fields.filter(field => field.complexStatus === "Active");
  }, [fields]);

  // tải dữ liệu khu sân và sân nhỏ
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (!isDemo && currentUserId) {
        // lấy tất cả khu sân và sân nhỏ
        const allComplexesWithFields = await fetchAllComplexesWithFields();

        // Lọc chỉ lấy các khu sân của owner
        const ownerComplexes = allComplexesWithFields
          .filter(
            complex => complex.ownerId === currentUserId || complex.ownerId === Number(currentUserId)
          )
          .map(complex => ({
            complexId: complex.complexId,
            ownerId: complex.ownerId,
            name: complex.name,
            address: complex.address,
            description: complex.description || null,
            image: complex.imageUrl || null,
            imageUrl: complex.imageUrl || null,
            status: complex.status,
            createdAt: complex.createdAt,
            ownerName: complex.ownerName || null,
            fields: complex.fields || [],
            fieldCount: complex.fieldCount || 0,
            lat: complex.lat || complex.latitude,
            lng: complex.lng || complex.longitude,
            latitude: complex.latitude || complex.lat,
            longitude: complex.longitude || complex.lng,
            ward: complex.ward || "",
            district: complex.district || "",
            province: complex.province || "",
          }));
        setComplexes(ownerComplexes);

        // Tạo danh sách tất cả các sân nhỏ từ các khu sân
        const allFields = [];
        for (const complex of ownerComplexes) {
          allFields.push(...(complex.fields || []).map(f => {
            const fieldType = apiFieldTypes.find(
              type => (type.typeId || type.TypeID) === f.typeId
            );

            const normalizedField = {
              ...f,
              complexName: complex.name,
              complexAddress: complex.address,
              complexStatus: complex.status,
              typeName: fieldType ? (fieldType.typeName || fieldType.TypeName) : null,
            };

            if (!normalizedField.mainImage && f.mainImageUrl) {
              normalizedField.mainImage = f.mainImageUrl;
            }

            if (!normalizedField.images || normalizedField.images.length === 0) {
              if (Array.isArray(f.imageUrls) && f.imageUrls.length > 0) {
                normalizedField.images = f.imageUrls;
              }
            }

            return normalizedField;
          }));
        }
        setFields(allFields);

        // lấy giờ
        const slotsResponse = await fetchTimeSlots();
        if (slotsResponse.success) {
          setTimeSlots(slotsResponse.data || []);
        }

        // lấy tài khoản ngân hàng
        try {
          const accounts = await fetchOwnerBankAccounts(Number(currentUserId));
          setBankAccounts(accounts || []);
        } catch (error) {
          console.error('Error loading bank accounts:', error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, isDemo, apiFieldTypes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    fields,
    setFields,
    complexes,
    setComplexes,
    timeSlots,
    bankAccounts,
    fieldTypes,
    fieldTypeMap,
    complexFieldCounts,
    activeFields,
    loadData,
  };
};
