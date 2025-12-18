import axios from "axios";
import {
  fetchField,
  fetchFieldComplex,
} from "../../../../../../shared/services/fields";

// tranh gọi API liên tục cho cùng một user
const playerProfileCache = new Map();
// lấy thông tin user
async function fetchPlayerProfile(userId) {
  if (!userId) return null;

  // Return from cache if available
  if (playerProfileCache.has(userId)) {
    return playerProfileCache.get(userId);
  }

  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`/api/PlayerProfile/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    const profileData = response.data || null;
    if (profileData) {
      playerProfileCache.set(userId, profileData);
    }
    return profileData;
  } catch (error) {
    console.error(
      `[normalizeAuthor] Failed to fetch player profile ${userId}:`,
      error
    );
    return null;
  }
}

// chuẩn hóa dữ liệu author
export async function normalizeAuthor(post, defaultUserId = null) {
  // xác định base userId từ post / author
  const baseUserId =
    (post.author &&
      (post.author.id ||
        post.author.userId ||
        post.author.userID ||
        post.author.UserID)) ||
    post.userId ||
    defaultUserId;
  // tên người dùng
  let username =
    post.author?.username ||
    post.author?.Username ||
    post.author?.userName ||
    "user";
  let fullName =
    post.author?.name ||
    post.author?.Name ||
    post.author?.fullName ||
    post.author?.FullName ||
    post.author?.full_name ||
    "Người dùng";
  let avatar =
    post.author?.avatar ||
    post.author?.Avatar ||
    post.author?.avatarUrl ||
    null;
  const verified =
    post.author?.verified ||
    post.author?.Verified ||
    post.author?.isVerified ||
    false;

  // Nếu chưa có avatar trong post, thử gọi PlayerProfile API để lấy avatar & fullName
  if (!avatar && baseUserId) {
    const profile = await fetchPlayerProfile(baseUserId);
    if (profile) {
      fullName = profile.fullName || fullName;
      avatar = profile.avatar || avatar;
    }
  }
  const safeFullName = fullName || "User";
  const finalAvatar =
    avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      safeFullName
    )}&background=0ea5e9&color=fff&size=100`;

  return {
    UserID: baseUserId,
    Username: username,
    FullName: safeFullName,
    Avatar: finalAvatar,
    Verified: !!verified,
  };
}

// chuẩn hóa dữ liệu field
export async function normalizeFieldData(post, fieldId = null) {
  const finalFieldId = fieldId || post.fieldId || post.fieldID || post.FieldID;

  if (post.field) {
    let address = "";
    let complexName = post.field.complexName || post.field.ComplexName || "";
    const complexId =
      post.field.complexId ||
      post.field.complexID ||
      post.field.ComplexID ||
      post.field.complex_id;

    if (complexId) {
      try {
        const complex = await fetchFieldComplex(complexId);
        if (complex) {
          address = complex.address || complex.Address || "";
          complexName = complex.name || complex.Name || complexName;
        } else {
          address =
            post.field.location ||
            post.field.Location ||
            post.field.address ||
            post.field.Address ||
            post.field.fieldAddress ||
            "";
        }
      } catch (err) {
        address =
          post.field.location ||
          post.field.Location ||
          post.field.address ||
          post.field.Address ||
          post.field.fieldAddress ||
          "";
      }
    } else {
      address =
        post.field.location ||
        post.field.Location ||
        post.field.address ||
        post.field.Address ||
        post.field.fieldAddress ||
        "";
    }

    return {
      FieldID:
        post.field.id ||
        post.field.fieldId ||
        post.field.fieldID ||
        post.field.FieldID ||
        finalFieldId,
      FieldName:
        post.field.name ||
        post.field.Name ||
        post.field.fieldName ||
        post.field.FieldName ||
        "",
      Location: address,
      Address: address,
      ComplexName: complexName,
      TypeName: post.field.typeName || post.field.TypeName || "",
      Size: post.field.size || post.field.Size || "",
      GrassType: post.field.grassType || post.field.GrassType || "",
      PricePerHour: post.field.pricePerHour || post.field.PricePerHour || 0,
      Rating: post.field.rating || post.field.Rating || 0,
      Description: post.field.description || post.field.Description || "",
    };
  } else if (finalFieldId && finalFieldId !== 0) {
    // lấy thông tin field nếu chỉ có fieldId
    try {
      const fieldData = await fetchField(finalFieldId);

      if (fieldData) {
        const fieldName = fieldData.name || fieldData.Name || "";
        const complexId =
          fieldData.complexId ||
          fieldData.complexID ||
          fieldData.ComplexID ||
          fieldData.complex_id;
        let complexName = "";
        let address = "";

        if (complexId) {
          try {
            const complex = await fetchFieldComplex(complexId);
            if (complex) {
              complexName = complex.name || complex.Name || "";
              address = complex.address || complex.Address || "";
            }
          } catch (err) {}
        }

        return {
          FieldID:
            fieldData.fieldId ||
            fieldData.fieldID ||
            fieldData.FieldID ||
            finalFieldId,
          FieldName: fieldName,
          Location: address,
          Address: address,
          ComplexName: complexName,
          TypeName: fieldData.typeName || fieldData.TypeName || "",
          Size: fieldData.size || fieldData.Size || "",
          GrassType: fieldData.grassType || fieldData.GrassType || "",
          PricePerHour: fieldData.pricePerHour || fieldData.PricePerHour || 0,
          Rating: fieldData.rating || fieldData.Rating || 0,
          Description: fieldData.description || fieldData.Description || "",
        };
      }
    } catch (error) {}
  }

  return null;
}

// chuẩn hóa dữ liệu post
export async function normalizePostData(post) {
  const author = await normalizeAuthor(post);
  const field = await normalizeFieldData(post);
  const fieldId = post.fieldId || post.fieldID || post.FieldID || null;
  const postUserId =
    post.userId || post.userID || post.UserID || author.UserID || null;

  return {
    PostID: post.id || post.postId,
    UserID: postUserId,
    Title: post.title,
    Content: post.content,
    MediaURL: post.mediaUrl,
    FieldID: fieldId,
    CreatedAt: post.createdAt,
    UpdatedAt: post.updatedAt,
    Status: post.status,
    author: author,
    field: field,
    likes: post.likes || 0,
    comments: post.comments || 0,
    reposts: 0,
    shares: 0,
    isLiked: post.isLiked || false,
    isReposted: false,
    isBookmarked: false,
  };
}

// lấy thông tin field cho post
export async function fetchFieldInfoForPost(field) {
  if (!field?.fieldId || field.fieldId === 0) {
    return null;
  }

  try {
    const fieldData = await fetchField(field.fieldId);
    if (!fieldData) {
      return {
        FieldID: field.fieldId,
        FieldName: field.name || "",
        Location: field.address || "",
        Address: field.address || "",
        ComplexName: field.complexName || "",
        TypeName: field.typeName || "",
        Size: field.size || "",
        GrassType: field.grassType || "",
        PricePerHour: field.pricePerHour || 0,
        Rating: field.rating || 0,
        Description: field.description || "",
      };
    }

    const fieldName = fieldData.name || fieldData.Name || field.name || "";
    const complexId =
      fieldData.complexId ||
      fieldData.complexID ||
      fieldData.ComplexID ||
      fieldData.complex_id;
    let complexName = "";
    let address = "";

    if (complexId) {
      try {
        const complex = await fetchFieldComplex(complexId);
        if (complex) {
          complexName = complex.name || complex.Name || "";
          address = complex.address || complex.Address || "";
        }
      } catch (err) {
        address = field.address || "";
      }
    } else {
      address = field.address || "";
    }

    return {
      FieldID:
        fieldData.fieldId ||
        fieldData.fieldID ||
        fieldData.FieldID ||
        field.fieldId,
      FieldName: fieldName,
      Location: address,
      Address: address,
      ComplexName: complexName,
      TypeName: fieldData.typeName || fieldData.TypeName || "",
      Size: fieldData.size || fieldData.Size || "",
      GrassType: fieldData.grassType || fieldData.GrassType || "",
      PricePerHour: fieldData.pricePerHour || fieldData.PricePerHour || 0,
      Rating: fieldData.rating || fieldData.Rating || 0,
      Description: fieldData.description || fieldData.Description || "",
    };
  } catch (error) {
    return {
      FieldID: field.fieldId,
      FieldName: field.name || "",
      Location: field.address || "",
      Address: field.address || "",
      ComplexName: field.complexName || "",
      TypeName: field.typeName || "",
      Size: field.size || "",
      GrassType: field.grassType || "",
      PricePerHour: field.pricePerHour || 0,
      Rating: field.rating || 0,
      Description: field.description || "",
    };
  }
}
