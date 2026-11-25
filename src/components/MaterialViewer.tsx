import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ComponentRef, useRef, useState } from 'react';
import { Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrand } from '@/components/Brand';
import { Text } from '@/components/Text';
import { Button } from '@/components/ui';
import type { SampleMaterial } from '@/data/sample';
import { colors, radius, shadow } from '@/theme';

// Sample content shown in the viewer. Real files will replace this once the backend serves them.
const SLIDES = [
  { heading: 'Why tapping technique matters', bullets: ['Healthy panels give more latex for more years', 'A poor cut shortens the life of the tree', 'Good habits start on day one'] },
  { heading: 'Choosing the tapping system', bullets: ['Half-spiral, every other day (S/2 d/2)', 'Match the system to clone and tree age', 'Rest the tree during wintering'] },
  { heading: 'Making the cut', bullets: ['Cut at 30–35° to the horizontal', 'Keep the depth 1 mm from the cambium', 'One smooth, steady pull of the knife'] },
  { heading: 'Collecting and handling latex', bullets: ['Use clean cups and collect within hours', 'Keep latex shaded and covered', 'Never mix old and fresh latex'] },
  { heading: 'Your next steps', bullets: ['Practise on the demo farm tomorrow', 'Bring your notes and questions', 'Complete your reentry plan after the activity'] },
];

const PAGES = [
  { heading: '1. Overview', body: 'Rubber (Hevea brasiliensis) is tapped for its latex. Good tapping protects the tree’s panel and keeps yields steady across the years. This sample page shows how a document appears in the viewer.' },
  { heading: '2. Tapping panel', body: 'Mark the tapping panel on the lower trunk and keep the cut slightly sloped so latex flows to the cup. Never cut into the wood; a shallow, even cut recovers faster.' },
  { heading: '3. Tools and safety', body: 'Use a sharp tapping knife, wear boots in wet areas, and keep tools clean. Store latex cups away from direct sun.' },
];

/** Opens a material in a full-screen sample viewer: slides, document pages, a photo or a link preview. */
export function MaterialViewer({
  material,
  onClose,
  onOpenLink,
}: {
  material: SampleMaterial | null;
  onClose: () => void;
  onOpenLink: () => void;
}) {
  const brand = useBrand();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [slide, setSlide] = useState(0);
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);

  const close = () => {
    setSlide(0);
    onClose();
  };

  const go = (i: number) => {
    const next = Math.max(0, Math.min(SLIDES.length - 1, i));
    pager.current?.scrollTo({ x: next * width, animated: true });
    setSlide(next);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setSlide(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  if (!material) return null;
  const isSlides = material.type === 'PowerPoint';
  const isDoc = material.type === 'PDF' || material.type === 'Word' || material.type === 'Handout';

  return (
    <Modal visible animationType="fade" onRequestClose={close}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.bar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close viewer" onPress={close} style={styles.barBtn} hitSlop={8}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.barTitle} numberOfLines={1}>
              {material.title}
            </Text>
            <Text style={styles.barSub}>
              {material.meta} · Sample preview
            </Text>
          </View>
        </View>

        {isSlides && (
          <>
            <ScrollView
              ref={pager}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScroll}
              style={{ flexGrow: 0 }}
            >
              {SLIDES.map((sl, i) => (
                <View key={sl.heading} style={{ width, padding: 16 }}>
                  <LinearGradient
                    colors={i === 0 ? [brand.dark, brand.primary] : ['#FFFFFF', brand.soft]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.slide}
                  >
                    {i === 0 ? (
                      <>
                        <Text style={[styles.slideKicker, { color: '#FFFFFF' }]}>PRRI · Skills training</Text>
                        <Text style={[styles.slideTitle, { color: '#FFFFFF' }]}>{material.title}</Text>
                        <Text style={[styles.slideBody, { color: '#FFFFFF' }]}>Philippine Rubber Research Institute</Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.slideKicker, { color: brand.primary }]}>Slide {i + 1}</Text>
                        <Text style={[styles.slideHeading, { color: colors.text }]}>{sl.heading}</Text>
                        {sl.bullets.map((b) => (
                          <View key={b} style={styles.bullet}>
                            <View style={[styles.dot, { backgroundColor: brand.primary }]} />
                            <Text style={[styles.slideBody, { color: colors.text, flex: 1 }]}>{b}</Text>
                          </View>
                        ))}
                      </>
                    )}
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
            <View style={styles.pager}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous slide" onPress={() => go(slide - 1)} disabled={slide === 0} style={[styles.arrow, slide === 0 && { opacity: 0.35 }]}>
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </Pressable>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={styles.count}>
                  Slide {slide + 1} of {SLIDES.length}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {SLIDES.map((sl, i) => (
                    <View key={sl.heading} style={[styles.pageDot, i === slide && { backgroundColor: '#FFFFFF', width: 18 }]} />
                  ))}
                </View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Next slide" onPress={() => go(slide + 1)} disabled={slide === SLIDES.length - 1} style={[styles.arrow, slide === SLIDES.length - 1 && { opacity: 0.35 }]}>
                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </>
        )}

        {isDoc && (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
            {PAGES.map((p, i) => (
              <View key={p.heading} style={styles.page}>
                <Text style={[styles.pageTitle, i === 0 && { fontSize: 20 }]}>{i === 0 ? material.title : p.heading}</Text>
                {i === 0 && <Text style={styles.pageHeading}>{p.heading}</Text>}
                <Text style={styles.pageBody}>{p.body}</Text>
                <View style={styles.lines}>
                  {[0.96, 0.9, 0.94, 0.6].map((w) => (
                    <View key={w} style={[styles.line, { width: `${w * 100}%` }]} />
                  ))}
                </View>
                <Text style={styles.pageNo}>
                  Page {i + 1} of {PAGES.length}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {material.type === 'Image' && (
          <View style={styles.center}>
            <LinearGradient colors={['#A7F3D0', '#2f5fcc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.photo}>
              <Ionicons name="image-outline" size={64} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
            <Text style={styles.caption}>Sample photo · {material.title}</Text>
          </View>
        )}

        {material.type === 'Link' && (
          <View style={styles.center}>
            <View style={styles.linkCard}>
              <Ionicons name="link-outline" size={32} color={brand.primary} />
              <Text style={styles.linkTitle}>{material.title}</Text>
              <Text style={styles.linkUrl}>https://prri.gov.ph/rubber-production-guide</Text>
              <Button label="Open link" onPress={onOpenLink} style={{ alignSelf: 'stretch' }} />
              <Text style={styles.linkNote}>Sample link. It would open in your browser.</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  barBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  barTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  barSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  slide: {
    aspectRatio: 16 / 10, borderRadius: radius.lg, padding: 20, justifyContent: 'center', gap: 10, ...shadow,
  },
  slideKicker: { fontSize: 12, fontWeight: '600' },
  slideTitle: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  slideHeading: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  slideBody: { fontSize: 14, lineHeight: 20 },
  bullet: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 20 },
  arrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  count: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  pageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  page: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 20, gap: 10, ...shadow },
  pageTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  pageHeading: { fontSize: 14, fontWeight: '600', color: colors.muted },
  pageBody: { fontSize: 14, lineHeight: 21, color: colors.text },
  lines: { gap: 8, marginTop: 4 },
  line: { height: 8, borderRadius: 4, backgroundColor: colors.border },
  pageNo: { fontSize: 12, color: colors.icon, textAlign: 'center', marginTop: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 14 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  caption: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  linkCard: { backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: 22, gap: 10, alignItems: 'center', alignSelf: 'stretch' },
  linkTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  linkUrl: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  linkNote: { fontSize: 12, color: colors.icon },
});
