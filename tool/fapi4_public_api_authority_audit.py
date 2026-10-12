from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
checks = []

def check(name, ok, detail=''):
    checks.append((name, bool(ok), detail))

index = (ROOT/'src/pages/Index.tsx').read_text(encoding='utf-8')
services_store = (ROOT/'src/stores/servicesStore.ts').read_text(encoding='utf-8')
projects = (ROOT/'src/pages/Projects.tsx').read_text(encoding='utf-8')
about = (ROOT/'src/pages/About.tsx').read_text(encoding='utf-8')
offers = (ROOT/'src/components/OfferBannerSlider.tsx').read_text(encoding='utf-8')
products = (ROOT/'src/pages/Products.tsx').read_text(encoding='utf-8')
user_products = (ROOT/'src/pages/user/UserProducts.tsx').read_text(encoding='utf-8')
public_state = (ROOT/'src/components/PublicApiState.tsx').read_text(encoding='utf-8')

footer = (ROOT/'src/components/Footer.tsx').read_text(encoding='utf-8')
contact = (ROOT/'src/pages/Contact.tsx').read_text(encoding='utf-8')
service_card = (ROOT/'src/components/ServiceCard2.tsx').read_text(encoding='utf-8')
whatsapp_float = (ROOT/'src/components/WhatsAppFloat.tsx').read_text(encoding='utf-8')
request_service = (ROOT/'src/components/Requestservicesection.tsx').read_text(encoding='utf-8')

for token in ['staticTeam','staticTestimonials','staticProjects','transformStaticServices','defaultServices']:
    all_public = '\n'.join([index, services_store, projects, about])
    check(f'no public business fallback token: {token}', token not in all_public)

check('homepage has no fabricated client offset', '+2426' not in index)
check('homepage has no fabricated project offset', '+3151' not in index)
check('homepage has no hardcoded 8K jobs fallback', '8K+' not in index)
check('services API errors clear service business data', 'services: []' in services_store and 'Failed to load services' in services_store)
check('projects expose API retry state', 'PublicApiState error={error} onRetry={refetch}' in projects)
check('about team uses API hook', 'useTeamMembers' in about and 'onRetry={refetch}' in about)
check('homepage services expose retry', 'onRetry={refreshServices}' in index)
check('homepage products expose retry', 'onRetry={refetchProducts}' in index)
check('homepage testimonials expose retry', 'onRetry={refetchTestimonials}' in index)
check('homepage team expose retry', 'onRetry={refetchTeam}' in index)
check('homepage settings expose retry', 'onRetry={fetchSocialLinks}' in index)
check('offers expose retry', 'setReloadKey' in offers and 'Offers could not be loaded.' in offers)
check('products retry without page reload', 'window.location.reload()' not in products and 'void refetch()' in products)
check('user products retry without page reload', 'window.location.reload()' not in user_products and 'void refetch()' in user_products)
check('shared public API state component exists', 'nativeApiErrorMessage' in public_state and 'Retry' in public_state)

check('request-service counters have no fabricated offsets', all(token not in request_service for token in ['+2426', '+3151', '5000+', '8000+']))
check('homepage contact settings are API-backed', 'siteSettings.phone_number' in index and 'getSiteSettingsCached' in index)
check('footer has no default business contact fallback', 'defaultSettings' not in footer and 'emptySettings' in footer and 'getSiteSettingsCached' in footer)
check('contact page uses site settings API', 'getSiteSettingsCached' in contact and 'PHONE_NUMBER' not in contact and 'EMAIL' not in contact)
check('service cards use site settings API contact', 'getSiteSettingsCached' in service_card and 'PHONE_NUMBER' not in service_card)
check('floating contact actions use site settings API', 'getSiteSettingsCached' in whatsapp_float and 'WHATSAPP_NUMBER' not in whatsapp_float and 'PHONE_NUMBER' not in whatsapp_float)
check('request-service support phone uses site settings API', 'getSiteSettingsCached' in request_service and 'PHONE_NUMBER' not in request_service)

failed = [c for c in checks if not c[1]]
for name, ok, detail in checks:
    print(('PASS' if ok else 'FAIL') + ' - ' + name + (f' :: {detail}' if detail else ''))
print(f'\nFAPI-4 checks: {len(checks)-len(failed)}/{len(checks)} PASS')
if failed:
    sys.exit(1)
print('FAPI-4 PUBLIC API AUTHORITY: PASS')
