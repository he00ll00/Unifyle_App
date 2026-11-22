import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { KeyboardAvoiding } from '@/components/keyboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrand } from '@/components/Brand';
import { StatusPill } from '@/components/bits';
import { Text, TextInput } from '@/components/Text';
import { Button, Card, Chip, PressableScale } from '@/components/ui';
import type { Activity } from '@/data/mock';
import { allSessions, certificateRules, feedbackForm, OutputKind, outputKinds, reentryFields } from '@/data/sample';
import { demoActions, FeedbackAnswers, useDemo } from '@/store/demo';
import { colors, radius } from '@/theme';

type Notify = (message: string) => void;

/* ------------------------------ Building blocks ------------------------------ */

/** Full-screen form page. It fades in, so the dark screen never slides up. */
function FormModal({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoiding style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
          <PressableScale accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.barBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </PressableScale>
          <Text style={styles.barTitle}>{title}</Text>
          <View style={styles.barBtn} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}>
          {children}
        </ScrollView>
        {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : null}
      </KeyboardAvoiding>
    </Modal>
  );
}

/** A question card, like one block of a Google Form. */
function Question({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: ReactNode }) {
  return (
    <Card style={[{ gap: 12 }, error && { borderWidth: 1, borderColor: colors.danger }]}>
      <Text style={styles.q}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.error}>This is a required question</Text> : null}
    </Card>
  );
}

/** Header card of a form: coloured top edge, title and a short note. */
function FormHeader({ title, note, children }: { title: string; note: string; children?: ReactNode }) {
  const brand = useBrand();
  return (
    <Card style={{ gap: 6, paddingTop: 0 }}>
      <View style={[styles.headerEdge, { backgroundColor: brand.primary }]} />
      <Text style={styles.formTitle}>{title}</Text>
      <Text style={styles.hint}>{note}</Text>
      {children}
    </Card>
  );
}

type Option = { value: string; label: string; note?: string };

/** Dropdown that opens its options right below the field. */
function Dropdown({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (v: string) => void }) {
  const brand = useBrand();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <Question label={label} required>
      <PressableScale scaleTo={0.99} accessibilityRole="button" onPress={() => setOpen((o) => !o)} style={styles.select}>
        <Text style={styles.selectText} numberOfLines={1}>
          {current?.label ?? 'Choose'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </PressableScale>
      {open && (
        <View style={styles.options}>
          {options.map((o) => (
            <PressableScale
              key={o.value}
              scaleTo={0.99}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={[styles.option, o.value === value && { backgroundColor: brand.soft }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.optionText}>{o.label}</Text>
                {o.note ? <Text style={styles.hint}>{o.note}</Text> : null}
              </View>
              {o.value === value && <Ionicons name="checkmark" size={18} color={brand.primary} />}
            </PressableScale>
          ))}
        </View>
      )}
    </Question>
  );
}

/** Underlined answer box, like a long answer in a Google Form. */
function AnswerInput({ value, onChangeText, placeholder, lines, editable = true }: { value: string; onChangeText: (t: string) => void; placeholder: string; lines: number; editable?: boolean }) {
  const brand = useBrand();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      placeholder={placeholder}
      placeholderTextColor={colors.icon}
      multiline={lines > 1}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.answer, { minHeight: 28 * lines }, focused && { borderBottomColor: brand.primary, borderBottomWidth: 2 }]}
    />
  );
}

/* ------------------------------ Activity feedback ------------------------------ */

/** Feedback form for a completed activity. The questions come from `feedbackForm` (set by the organization). */
function FeedbackForm({ visible, onClose, activities, activityId, notify }: { visible: boolean; onClose: () => void; activities: Activity[]; activityId: string; notify: Notify }) {
  const brand = useBrand();
  const demo = useDemo();
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<FeedbackAnswers>({});
  const [anonymous, setAnonymous] = useState(false);
  const [tried, setTried] = useState(false);

  const aid = picked ?? activityId;
  const activity = activities.find((a) => a.id === aid) ?? activities[0];
  const sent = activity ? demo.feedback[activity.id] : undefined;
  const shown = sent?.answers ?? answers;
  const isEmpty = (id: string) => shown[id] === undefined || shown[id] === '';
  const missing = (id: string) => tried && !sent && feedbackForm.questions.some((q) => q.id === id && q.required && !answers[id]);

  const reset = () => {
    setAnswers({});
    setAnonymous(false);
    setTried(false);
  };
  const close = () => {
    onClose();
    setPicked(null);
    reset();
  };

  const submit = () => {
    if (!activity) return;
    setTried(true);
    if (feedbackForm.questions.some((q) => q.required && !answers[q.id])) return;
    demoActions.submitFeedback(activity.id, answers, anonymous);
    notify('Feedback submitted. Thank you!');
    close();
  };

  return (
    <FormModal
      visible={visible}
      onClose={close}
      title="Feedback form"
      footer={
        sent ? (
          <Button label="Close" variant="soft" onPress={close} />
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Clear form" variant="soft" style={{ flex: 1 }} onPress={reset} />
            <Button label="Submit" style={{ flex: 1 }} onPress={submit} />
          </View>
        )
      }
    >
      <FormHeader title={feedbackForm.title} note={feedbackForm.intro}>
        <View style={styles.row}>
          {sent ? <StatusPill label="Submitted" tone="ok" /> : <Text style={[styles.hint, { color: colors.danger }]}>* Required</Text>}
        </View>
      </FormHeader>

      <Dropdown
        label="Activity"
        value={activity?.id ?? ''}
        onChange={(v) => {
          setPicked(v);
          reset();
        }}
        options={activities.map((a) => ({ value: a.id, label: a.title, note: demo.feedback[a.id] ? 'Submitted' : a.dates }))}
      />

      {feedbackForm.questions.map((q) => (
        <Question key={q.id} label={q.label} required={q.required} error={missing(q.id)}>
          {q.type === 'rating' && (
            <View style={{ gap: 8 }}>
              <View style={styles.circles}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const on = n <= Number(shown[q.id] ?? 0);
                  return (
                    <PressableScale
                      key={n}
                      scaleTo={0.9}
                      accessibilityRole="button"
                      accessibilityLabel={`${n} of 5`}
                      disabled={!!sent}
                      onPress={() => setAnswers((a) => ({ ...a, [q.id]: n }))}
                      style={styles.circleCell}
                    >
                      <View style={[styles.circle, { borderColor: on ? brand.primary : colors.icon }, on && { backgroundColor: brand.primary }]} />
                      <Text style={styles.circleNum}>{n}</Text>
                    </PressableScale>
                  );
                })}
              </View>
              <View style={styles.between}>
                <Text style={styles.hint}>{q.low}</Text>
                <Text style={styles.hint}>{q.high}</Text>
              </View>
            </View>
          )}
          {q.type === 'choice' && (
            <View style={{ gap: 2 }}>
              {q.options.map((o) => {
                const on = shown[q.id] === o;
                return (
                  <PressableScale
                    key={o}
                    scaleTo={0.99}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    disabled={!!sent}
                    onPress={() => setAnswers((a) => ({ ...a, [q.id]: o }))}
                    style={styles.choice}
                  >
                    <View style={[styles.radio, { borderColor: on ? brand.primary : colors.icon }]}>{on && <View style={[styles.radioDot, { backgroundColor: brand.primary }]} />}</View>
                    <Text style={styles.optionText}>{o}</Text>
                  </PressableScale>
                );
              })}
            </View>
          )}
          {q.type === 'comment' && (
            <AnswerInput
              value={String(isEmpty(q.id) ? '' : shown[q.id])}
              editable={!sent}
              onChangeText={(t) => setAnswers((a) => ({ ...a, [q.id]: t }))}
              placeholder="Your answer"
              lines={2}
            />
          )}
        </Question>
      ))}

      {feedbackForm.anonymousAllowed && (
        <Card style={styles.anon}>
          <View style={{ flex: 1 }}>
            <Text style={styles.q}>Send anonymously</Text>
            <Text style={styles.hint}>The organization will not see your name with this feedback.</Text>
          </View>
          <Switch
            value={sent ? sent.anonymous : anonymous}
            disabled={!!sent}
            onValueChange={setAnonymous}
            trackColor={{ true: brand.primary, false: colors.border }}
          />
        </Card>
      )}
    </FormModal>
  );
}

/* ------------------------------ Reentry plan ------------------------------ */

function ReentryForm({ visible, onClose, activities, activityId, notify }: { visible: boolean; onClose: () => void; activities: Activity[]; activityId: string; notify: Notify }) {
  const brand = useBrand();
  const demo = useDemo();
  const [picked, setPicked] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string> | null>(null);
  const [doc, setDoc] = useState<string | null | undefined>(undefined);
  const [tried, setTried] = useState(false);

  const aid = picked ?? activityId;
  const activity = activities.find((a) => a.id === aid) ?? activities[0];
  const saved = activity ? demo.reentry[activity.id] : undefined;
  const submitted = saved?.status === 'submitted';
  const values = edits ?? saved?.values ?? {};
  const document = doc === undefined ? saved?.document : (doc ?? undefined);
  const missing = (id: string) => tried && !submitted && reentryFields.some((f) => f.id === id && f.required && !values[f.id]?.trim());

  const close = () => {
    onClose();
    setPicked(null);
    setEdits(null);
    setDoc(undefined);
    setTried(false);
  };

  const save = (submit: boolean) => {
    if (!activity) return;
    if (submit) {
      setTried(true);
      if (reentryFields.some((f) => f.required && !values[f.id]?.trim())) return;
    }
    demoActions.saveReentry(activity.id, values, document, submit);
    notify(submit ? 'Reentry plan submitted' : 'Draft saved');
    close();
  };

  return (
    <FormModal
      visible={visible}
      onClose={close}
      title="Reentry plan"
      footer={
        submitted ? (
          <Button label="Close" variant="soft" onPress={close} />
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Save draft" variant="soft" style={{ flex: 1 }} onPress={() => save(false)} />
            <Button label="Submit plan" style={{ flex: 1 }} onPress={() => save(true)} />
          </View>
        )
      }
    >
      <FormHeader title="Reentry plan" note="Describe how you will apply what you learned after the activity.">
        <View style={styles.row}>
          {submitted ? <StatusPill label="Submitted" tone="ok" /> : saved ? <StatusPill label="Draft" tone="info" /> : <Text style={[styles.hint, { color: colors.danger }]}>* Required</Text>}
        </View>
      </FormHeader>

      <Dropdown
        label="Activity"
        value={activity?.id ?? ''}
        onChange={(v) => {
          setPicked(v);
          setEdits(null);
          setDoc(undefined);
          setTried(false);
        }}
        options={activities.map((a) => ({
          value: a.id,
          label: a.title,
          note: demo.reentry[a.id]?.status === 'submitted' ? 'Submitted' : a.dates,
        }))}
      />

      {reentryFields.map((f) => (
        <Question key={f.id} label={f.label} required={f.required} error={missing(f.id)}>
          <AnswerInput
            value={values[f.id] ?? ''}
            editable={!submitted}
            onChangeText={(t) => setEdits({ ...values, [f.id]: t })}
            placeholder={f.hint}
            lines={f.lines}
          />
        </Question>
      ))}

      <Question label="Attached document (optional)">
        {document ? (
          <View style={styles.file}>
            <Ionicons name="document-text-outline" size={22} color={brand.primary} />
            <Text style={[styles.optionText, { flex: 1 }]} numberOfLines={1}>
              {document}
            </Text>
            {!submitted && (
              <PressableScale accessibilityRole="button" accessibilityLabel="Remove document" scaleTo={0.9} onPress={() => setDoc(null)}>
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </PressableScale>
            )}
          </View>
        ) : (
          <PressableScale
            scaleTo={0.98}
            accessibilityRole="button"
            disabled={submitted}
            onPress={() => setDoc('Reentry-plan.pdf')}
            style={[styles.drop, { borderColor: brand.primary, backgroundColor: brand.soft }]}
          >
            <Ionicons name="attach" size={26} color={brand.primary} />
            <Text style={[styles.dropText, { color: brand.dark }]}>Attach a document</Text>
            <Text style={styles.hint}>Sample file, nothing is uploaded</Text>
          </PressableScale>
        )}
      </Question>
    </FormModal>
  );
}

/* ------------------------------ Output submissions ------------------------------ */

const KIND_ICON: Record<OutputKind, React.ComponentProps<typeof Ionicons>['name']> = {
  Photo: 'image-outline',
  File: 'document-text-outline',
  Video: 'videocam-outline',
};
const KIND_FILE: Record<OutputKind, string> = { Photo: 'output-photo.jpg', File: 'output-report.pdf', Video: 'output-video.mp4' };
const WHOLE = 'whole';

function OutputForm({ visible, onClose, activities, activityId, notify }: { visible: boolean; onClose: () => void; activities: Activity[]; activityId: string; notify: Notify }) {
  const brand = useBrand();
  const demo = useDemo();
  const [picked, setPicked] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<OutputKind>('Photo');
  const [session, setSession] = useState(WHOLE);
  const [attached, setAttached] = useState(false);
  const [tried, setTried] = useState(false);

  const aid = picked ?? activityId;
  const activity = activities.find((a) => a.id === aid) ?? activities[0];
  const outputs = activity ? (demo.outputs[activity.id] ?? []) : [];

  const reset = () => {
    setTitle('');
    setKind('Photo');
    setSession(WHOLE);
    setAttached(false);
    setTried(false);
  };
  const close = () => {
    onClose();
    setPicked(null);
    reset();
  };

  const submit = () => {
    if (!activity) return;
    setTried(true);
    if (!title.trim() || !attached) return;
    demoActions.addOutput(activity.id, { title: title.trim(), kind, session: session === WHOLE ? undefined : allSessions.find((x) => x.id === session)?.title });
    notify('Output submitted');
    reset();
  };

  return (
    <FormModal visible={visible} onClose={close} title="Output submission" footer={<Button label="Done" variant="soft" onPress={close} />}>
      <FormHeader title="Output submission" note="Submit a photo, file or video of what you made or practised during the activity." />

      <Dropdown
        label="Activity"
        value={activity?.id ?? ''}
        onChange={(v) => {
          setPicked(v);
          reset();
        }}
        options={activities.map((a) => ({ value: a.id, label: a.title, note: `${demo.outputs[a.id]?.length ?? 0} submitted` }))}
      />

      <Question label="Title" required error={tried && !title.trim()}>
        <AnswerInput value={title} onChangeText={setTitle} placeholder="e.g. Tapping practicum photo" lines={1} />
      </Question>

      <Question label="Type" required>
        <View style={styles.kinds}>
          {outputKinds.map((k) => (
            <Chip key={k} label={k} active={kind === k} onPress={() => { setKind(k); setAttached(false); }} />
          ))}
        </View>
      </Question>

      <Dropdown
        label="Session"
        value={session}
        onChange={setSession}
        options={[{ value: WHOLE, label: 'Whole activity' }, ...allSessions.map((x) => ({ value: x.id, label: x.title, note: x.date }))]}
      />

      <Question label="File" required error={tried && !attached}>
        {attached ? (
          <View style={styles.file}>
            <Ionicons name={KIND_ICON[kind]} size={22} color={brand.primary} />
            <Text style={[styles.optionText, { flex: 1 }]} numberOfLines={1}>
              {KIND_FILE[kind]}
            </Text>
            <PressableScale accessibilityRole="button" accessibilityLabel="Remove file" scaleTo={0.9} onPress={() => setAttached(false)}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </PressableScale>
          </View>
        ) : (
          <PressableScale
            scaleTo={0.98}
            accessibilityRole="button"
            onPress={() => setAttached(true)}
            style={[styles.drop, { borderColor: brand.primary, backgroundColor: brand.soft }]}
          >
            <Ionicons name="cloud-upload-outline" size={30} color={brand.primary} />
            <Text style={[styles.dropText, { color: brand.dark }]}>Tap to choose a {kind.toLowerCase()}</Text>
            <Text style={styles.hint}>Sample file, nothing is uploaded</Text>
          </PressableScale>
        )}
      </Question>

      <Button label="Submit output" onPress={submit} />

      {outputs.length > 0 && (
        <>
          <Text style={styles.q}>Submitted ({outputs.length})</Text>
          <Card style={{ paddingVertical: 4 }}>
            {outputs.map((o, i) => (
              <View key={`${o.title}-${i}`} style={[styles.checkRow, i > 0 && styles.checkBorder]}>
                <View style={[styles.kindIcon, { backgroundColor: brand.soft }]}>
                  <Ionicons name={KIND_ICON[o.kind]} size={20} color={brand.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{o.title}</Text>
                  <Text style={styles.hint}>
                    {o.kind} · {o.session ?? 'Whole activity'}
                  </Text>
                </View>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${o.title}`}
                  scaleTo={0.9}
                  onPress={() => activity && demoActions.removeOutput(activity.id, i)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.muted} />
                </PressableScale>
              </View>
            ))}
          </Card>
        </>
      )}
    </FormModal>
  );
}

/* ------------------------------ Hook that hosts the forms ------------------------------ */

type Open = { kind: 'feedback' | 'reentry' | 'outputs'; activityId: string } | null;

/** Opens the three forms from any screen. `activities` are the ones the forms may pick from. */
export function useSubmissionForms(activities: Activity[], notify: Notify) {
  const [open, setOpen] = useState<Open>(null);
  const [last, setLast] = useState<NonNullable<Open>>({ kind: 'feedback', activityId: activities[0]?.id ?? '' });
  const show = (next: NonNullable<Open>) => {
    setLast(next);
    setOpen(next);
  };
  const close = () => setOpen(null);

  const opener = {
    feedback: (activityId: string) => show({ kind: 'feedback', activityId }),
    reentry: (activityId: string) => show({ kind: 'reentry', activityId }),
    outputs: (activityId: string) => show({ kind: 'outputs', activityId }),
  };

  const node = (
    <>
      <FeedbackForm visible={open?.kind === 'feedback'} onClose={close} activities={activities} activityId={last.activityId} notify={notify} />
      <ReentryForm visible={open?.kind === 'reentry'} onClose={close} activities={activities} activityId={last.activityId} notify={notify} />
      <OutputForm visible={open?.kind === 'outputs'} onClose={close} activities={activities} activityId={last.activityId} notify={notify} />
    </>
  );
  return { open: opener, node };
}

export type FormOpener = ReturnType<typeof useSubmissionForms>['open'];

/* ------------------------------ Checklist ------------------------------ */

/**
 * Feedback, reentry plan and output submission for one activity, each with a check mark once done.
 * They only open once the activity is completed (`locked` until then).
 */
export function ChecklistRows({ activity, open, locked }: { activity: Activity; open: FormOpener; locked: boolean }) {
  const brand = useBrand();
  const demo = useDemo();
  const plan = demo.reentry[activity.id];
  const outputs = demo.outputs[activity.id]?.length ?? 0;
  const lockedNote = 'Opens after the activity';

  const rows = [
    {
      key: 'feedback',
      label: 'Activity feedback',
      done: !!demo.feedback[activity.id],
      note: locked ? lockedNote : demo.feedback[activity.id] ? 'Submitted' : 'Not submitted',
      onPress: () => open.feedback(activity.id),
    },
    {
      key: 'reentry',
      label: 'Reentry plan',
      done: plan?.status === 'submitted',
      note: locked ? lockedNote : plan ? (plan.status === 'submitted' ? 'Submitted' : 'Draft saved') : 'Not started',
      onPress: () => open.reentry(activity.id),
    },
    {
      key: 'outputs',
      label: 'Output submission',
      done: outputs > 0,
      note: locked ? lockedNote : outputs > 0 ? `${outputs} submitted` : certificateRules.requireOutput ? 'Required for the certificate' : 'Optional',
      onPress: () => open.outputs(activity.id),
    },
  ];

  return (
    <View>
      {rows.map((r, i) => (
        <PressableScale
          key={r.key}
          scaleTo={0.98}
          accessibilityRole="button"
          disabled={locked}
          onPress={r.onPress}
          style={[styles.checkRow, i > 0 && styles.checkBorder]}
        >
          <Ionicons
            name={locked ? 'lock-closed-outline' : r.done ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={r.done && !locked ? brand.primary : colors.icon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{r.label}</Text>
            <Text style={styles.hint}>{r.note}</Text>
          </View>
          {!locked && <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  barBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  barTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  headerEdge: { height: 8, marginHorizontal: -14, marginBottom: 12, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  formTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  q: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20 },
  error: { fontSize: 12, color: colors.danger },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  selectText: { flex: 1, fontSize: 14, color: colors.text },
  options: { borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, paddingVertical: 8 },
  optionText: { fontSize: 14, color: colors.text },
  answer: { fontSize: 14, color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6, textAlignVertical: 'top' },
  circles: { flexDirection: 'row', justifyContent: 'space-between' },
  circleCell: { alignItems: 'center', gap: 4, minWidth: 48 },
  circle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2 },
  circleNum: { fontSize: 12, color: colors.muted },
  drop: { alignItems: 'center', gap: 4, paddingVertical: 24, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed' },
  dropText: { fontSize: 14, fontWeight: '600' },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  anon: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  file: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  checkBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
});
