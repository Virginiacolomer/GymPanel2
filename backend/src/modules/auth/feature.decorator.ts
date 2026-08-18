import { SetMetadata } from '@nestjs/common';
import { Funcionalidad } from '../gimnasio/funcionalidades';

export const REQUIRE_FEATURE_KEY = 'requireFeature';

// Bloquea la ruta si el plan del gimnasio del usuario no incluye esta
// funcionalidad (ver funcionalidades.ts). Se usa junto con @Roles(), nunca
// en reemplazo: FeatureGuard no valida rol, solo el plan pagado.
export const RequireFeature = (feature: Funcionalidad) => SetMetadata(REQUIRE_FEATURE_KEY, feature);
