import { FadeIn } from "../../../../../../shared/components/ui";
import FieldDetailView from "./FieldDetailView";
import ComplexInfoView from "./ComplexInfoView";

export default function InfoTabContent({
     selectedField,
     complex,
     fields,
     selectedSlotId,
     availableCount,
     cheapestSlot,
     priciestSlot,
     bigComposeCount,
     cancellationPolicy,
     promotions,
     selectedFieldCheapestSlot,
     selectedFieldPriciestSlot,
     onBack,
     onFieldSelect,
     onQuickBookField,
     onToggleFavoriteField
}) {
     return (
          <FadeIn delay={100}>
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center">
                         <h3 className="text-2xl font-extrabold text-teal-800">
                              {selectedField ? "Thông tin sân nhỏ" : "Thông tin khu sân"}
                         </h3>
                         <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                    </div>

                    {selectedField ? (
                         <FieldDetailView
                              selectedField={selectedField}
                              complex={complex}
                              selectedSlotId={selectedSlotId}
                              selectedFieldCheapestSlot={selectedFieldCheapestSlot}
                              selectedFieldPriciestSlot={selectedFieldPriciestSlot}
                              onBack={onBack}
                              onQuickBook={() => onQuickBookField(selectedField.fieldId)}
                              onToggleFavoriteField={onToggleFavoriteField}
                         />
                    ) : (
                         <ComplexInfoView
                              complex={complex}
                              fields={fields}
                              availableCount={availableCount}
                              cheapestSlot={cheapestSlot}
                              priciestSlot={priciestSlot}
                              bigComposeCount={bigComposeCount}
                              cancellationPolicy={cancellationPolicy}
                              promotions={promotions}
                              selectedSlotId={selectedSlotId}
                              onFieldSelect={onFieldSelect}
                              onQuickBookField={onQuickBookField}
                         />
                    )}
               </div>
          </FadeIn>
     );
}

