import { fetchField, fetchFieldComplex } from "../../../../../../shared/services/fields";

/**
 * Normalize author data from various formats
 */
export function normalizeAuthor(post, defaultUserId = null) {
     if (post.author) {
          return {
               UserID: post.author.id || post.author.userId || post.author.userID || post.author.UserID || post.userId || defaultUserId,
               Username: post.author.username || post.author.Username || post.author.userName || "user",
               FullName: post.author.name || post.author.Name || post.author.fullName || post.author.FullName || post.author.full_name || "Người dùng",
               Avatar: post.author.avatar || post.author.Avatar || post.author.avatarUrl || "https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff&size=100",
               Verified: post.author.verified || post.author.Verified || post.author.isVerified || false
          };
     }
     return {
          UserID: post.userId || defaultUserId,
          Username: "user",
          FullName: "Người dùng",
          Avatar: "https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff&size=100",
          Verified: false
     };
}

/**
 * Normalize field data and fetch complex address
 */
export async function normalizeFieldData(post, fieldId = null) {
     const finalFieldId = fieldId || post.fieldId || post.fieldID || post.FieldID;
     
     if (post.field) {
          // Field object exists, normalize it
          let address = "";
          let complexName = post.field.complexName || post.field.ComplexName || "";
          const complexId = post.field.complexId || post.field.complexID || post.field.ComplexID || post.field.complex_id;

          if (complexId) {
               try {
                    console.log(`[normalizeFieldData] Fetching complex ${complexId} for address...`);
                    const complex = await fetchFieldComplex(complexId);
                    if (complex) {
                         address = complex.address || complex.Address || "";
                         complexName = complex.name || complex.Name || complexName;
                    } else {
                         address = post.field.location || post.field.Location || post.field.address || post.field.Address || post.field.fieldAddress || "";
                    }
               } catch (err) {
                    console.error(`[normalizeFieldData] Failed to fetch complex ${complexId}:`, err);
                    address = post.field.location || post.field.Location || post.field.address || post.field.Address || post.field.fieldAddress || "";
               }
          } else {
               address = post.field.location || post.field.Location || post.field.address || post.field.Address || post.field.fieldAddress || "";
          }

          return {
               FieldID: post.field.id || post.field.fieldId || post.field.fieldID || post.field.FieldID || finalFieldId,
               FieldName: post.field.name || post.field.Name || post.field.fieldName || post.field.FieldName || "",
               Location: address,
               Address: address,
               ComplexName: complexName,
               TypeName: post.field.typeName || post.field.TypeName || "",
               Size: post.field.size || post.field.Size || "",
               GrassType: post.field.grassType || post.field.GrassType || "",
               PricePerHour: post.field.pricePerHour || post.field.PricePerHour || 0,
               Rating: post.field.rating || post.field.Rating || 0,
               Description: post.field.description || post.field.Description || ""
          };
     } else if (finalFieldId && finalFieldId !== 0) {
          // Try to fetch field information if only fieldId is provided
          try {
               console.log(`[normalizeFieldData] Fetching field detail for fieldId: ${finalFieldId}`);
               const fieldData = await fetchField(finalFieldId);

               if (fieldData) {
                    const fieldName = fieldData.name || fieldData.Name || "";
                    const complexId = fieldData.complexId || fieldData.complexID || fieldData.ComplexID || fieldData.complex_id;
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
                              console.error(`[normalizeFieldData] Failed to fetch complex ${complexId}:`, err);
                         }
                    }

                    return {
                         FieldID: fieldData.fieldId || fieldData.fieldID || fieldData.FieldID || finalFieldId,
                         FieldName: fieldName,
                         Location: address,
                         Address: address,
                         ComplexName: complexName,
                         TypeName: fieldData.typeName || fieldData.TypeName || "",
                         Size: fieldData.size || fieldData.Size || "",
                         GrassType: fieldData.grassType || fieldData.GrassType || "",
                         PricePerHour: fieldData.pricePerHour || fieldData.PricePerHour || 0,
                         Rating: fieldData.rating || fieldData.Rating || 0,
                         Description: fieldData.description || fieldData.Description || ""
                    };
               }
          } catch (error) {
               console.warn(`[normalizeFieldData] Failed to fetch field ${finalFieldId}:`, error);
          }
     }

     return null;
}

/**
 * Normalize post data from API response
 */
export async function normalizePostData(post) {
     const author = normalizeAuthor(post);
     const field = await normalizeFieldData(post);
     const fieldId = post.fieldId || post.fieldID || post.FieldID || null;
     const postUserId = post.userId || post.userID || post.UserID || author.UserID || null;

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
          isBookmarked: false
     };
}

/**
 * Fetch field info for new/updated post
 */
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
                    Description: field.description || ""
               };
          }

          const fieldName = fieldData.name || fieldData.Name || field.name || "";
          const complexId = fieldData.complexId || fieldData.complexID || fieldData.ComplexID || fieldData.complex_id;
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
                    console.error(`[fetchFieldInfoForPost] Failed to fetch complex ${complexId}:`, err);
                    address = field.address || "";
               }
          } else {
               address = field.address || "";
          }

          return {
               FieldID: fieldData.fieldId || fieldData.fieldID || fieldData.FieldID || field.fieldId,
               FieldName: fieldName,
               Location: address,
               Address: address,
               ComplexName: complexName,
               TypeName: fieldData.typeName || fieldData.TypeName || "",
               Size: fieldData.size || fieldData.Size || "",
               GrassType: fieldData.grassType || fieldData.GrassType || "",
               PricePerHour: fieldData.pricePerHour || fieldData.PricePerHour || 0,
               Rating: fieldData.rating || fieldData.Rating || 0,
               Description: fieldData.description || fieldData.Description || ""
          };
     } catch (error) {
          console.warn("[fetchFieldInfoForPost] Failed to fetch field detail:", error);
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
               Description: field.description || ""
          };
     }
}

