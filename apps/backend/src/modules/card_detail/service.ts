import { MedusaService } from "@medusajs/framework/utils";
import CardDetail from "./models/card-detail";

class CardDetailModuleService extends MedusaService({
  CardDetail,
}) {}

export default CardDetailModuleService;
