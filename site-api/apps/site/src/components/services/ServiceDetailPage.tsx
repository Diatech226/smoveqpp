import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Navigation from '../Navigation';
import Footer from '../Footer';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { serviceRepository } from '../../repositories/serviceRepository';
import { fetchPublicServices } from '../../utils/publicContentApi';
import { useRemoteRepositorySync } from '../../features/content-sync/useRemoteRepositorySync';
import { buildServiceDetailContract, findPublishedServiceBySlug } from '../../features/marketing/serviceDetailContract';
import { applyPageMetadata } from '../../features/marketing/pageMetadata';
import { PUBLIC_ROUTE_HASH } from '../../features/marketing/publicRoutes';
import { toRenderableService } from '../../features/marketing/serviceCatalog';
import { trackSiteEvent } from '../../utils/analytics';

interface ServiceDetailPageProps {
  slug: string;
}

export default function ServiceDetailPage({ slug }: ServiceDetailPageProps) {
  const [serviceVersion, setServiceVersion] = useState(0);

  const applyRemoteServices = useCallback((remote: Awaited<ReturnType<typeof fetchPublicServices>>) => {
    return serviceRepository.replaceAll(remote);
  }, []);

  const handleServicesSynced = useCallback(() => {
    setServiceVersion((value) => value + 1);
  }, []);

  useRemoteRepositorySync({
    fetchRemote: fetchPublicServices,
    applyRemote: applyRemoteServices,
    onSynced: handleServicesSynced,
  });

  const service = useMemo(() => findPublishedServiceBySlug(serviceRepository.getAll(), slug), [serviceVersion, slug]);
  const detail = useMemo(() => (service ? buildServiceDetailContract(service) : null), [service]);
  const renderable = useMemo(() => (service ? toRenderableService(service) : null), [service]);

  useEffect(() => {
    if (!detail) return;
    trackSiteEvent({ name: 'service_detail_opened', route: 'service-detail', entityType: 'service', entityId: detail.routeSlug, targetRoute: `/services/${detail.routeSlug}` });
    applyPageMetadata({
      title: detail.title,
      description: detail.shortDescription || detail.overview,
      routePath: `/services/${detail.routeSlug}` ,
      image: detail.heroMedia.src || '',
    });
  }, [detail]);

  if (!detail || !renderable) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation currentPath="/services" />
        <section className="pt-32 pb-20 bg-gradient-to-b from-[#f5f9fa] to-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-['ABeeZee:Regular',sans-serif] text-[48px] text-[#273a41] mb-4">Service indisponible</h1>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[20px] text-[#38484e] mb-8">
              Ce service n'est pas publié ou n'existe pas.
            </p>
            <a
              href={PUBLIC_ROUTE_HASH.services}
              className="inline-flex items-center gap-2 bg-[#00b3e8] text-white px-8 py-4 rounded-[15px] font-['Abhaya_Libre:Bold',sans-serif]"
            >
              Retour aux services
              <ArrowRight size={18} />
            </a>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPath="/services" />

      <section className="pt-32 pb-20 bg-gradient-to-b from-[#f5f9fa] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-white bg-gradient-to-r ${renderable.color} mb-6`}>
              <renderable.iconComponent size={18} />
              <span className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px]">{detail.title}</span>
            </div>
            <h1 className="font-['ABeeZee:Regular',sans-serif] text-[52px] md:text-[64px] text-[#273a41] mb-6">{detail.title}</h1>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[20px] text-[#38484e] leading-relaxed mb-4">{detail.shortDescription}</p>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[18px] text-[#38484e] leading-relaxed">{detail.overview}</p>
          </div>
          <motion.div
            className="aspect-[4/3] rounded-[24px] overflow-hidden shadow-2xl"
            whileHover={{ scale: 1.02 }}
          >
            {detail.heroMedia.isMediaAsset ? (
              <ImageWithFallback
                src={detail.heroMedia.src}
                alt={detail.heroMedia.alt}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${renderable.color} flex items-center justify-center`}>
                <div className="text-center text-white px-6">
                  <renderable.iconComponent size={72} className="mx-auto mb-4" />
                  <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[20px]">{detail.heroMedia.alt}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-['Medula_One:Regular',sans-serif] text-[44px] tracking-[4px] uppercase text-[#273a41] mb-8">Fonctionnalités clés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {detail.features.map((feature, index) => (
              <div key={`${feature}-${index}`} className="bg-[#f5f9fa] rounded-[16px] p-6 flex items-start gap-3">
                <CheckCircle className="text-[#00b3e8] mt-1" size={20} />
                <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[18px] text-[#38484e]">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f5f9fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-['Medula_One:Regular',sans-serif] text-[44px] tracking-[4px] uppercase text-[#273a41] mb-4">{detail.processTitle}</h2>
          <div className="space-y-4">
            {detail.processSteps.map((step, index) => (
              <div key={`${step}-${index}`} className="bg-white rounded-[14px] p-5 flex items-center gap-4">
                <span className="bg-[#00b3e8] text-white w-9 h-9 rounded-full inline-flex items-center justify-center text-[14px] font-semibold">
                  {index + 1}
                </span>
                <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[18px] text-[#38484e]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-[#00b3e8] to-[#00c0e8]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="font-['ABeeZee:Regular',sans-serif] text-[42px] text-white mb-4">{detail.cta.title}</h2>
          <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[20px] text-white/90 mb-8">{detail.cta.description}</p>
          <a
            href={detail.cta.primaryHref}
            className="inline-flex items-center gap-2 bg-white text-[#00b3e8] px-8 py-4 rounded-[14px] font-['Abhaya_Libre:Bold',sans-serif]"
            onClick={() => trackSiteEvent({ name: 'cta_clicked', route: 'service-detail', ctaId: 'service_contact', targetRoute: detail.cta.primaryHref, entityType: 'service', entityId: detail.routeSlug })}
          >
            {detail.cta.primaryLabel}
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
