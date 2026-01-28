import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    useWindowDimensions,
} from "react-native";

const DESIGN_W = 360;
const DESIGN_H = 780;

const GREEN = "#2E5A35";
const LIGHT_GREEN = "#75A743";
const BG = "#EDEDE9";

const PIXEL_SIZE = 4;

const BTN_DISABLED_FILL = "#BFD6B0";
const BTN_DISABLED_FRAME = "#6E8B72";

export default function InitialSetupScreen({ navigation }: any) {
    const { width: screenW, height: screenH } = useWindowDimensions();

    const scale = useMemo(() => {
        const s = Math.floor(Math.min(screenW / DESIGN_W, screenH / DESIGN_H));
        return Math.max(1, s);
    }, [screenW, screenH]);

    const [deviceId, setDeviceId] = useState("");
    const [plantNick, setPlantNick] = useState("");
    const [plantType, setPlantType] = useState("");

    const canSubmit = useMemo(() => {
        const did = deviceId.trim().length > 0;
        const pn = plantNick.trim().length > 0;
        const pt = plantType.trim().length > 0;
        return did && pn && pt;
    }, [deviceId, plantNick, plantType]);

    const onSubmit = () => {
        if (!canSubmit) return;
        Alert.alert("초기 등록 완료", "설정이 완료되었습니다 🌱", [
            { text: "메인으로", onPress: () => navigation.replace("Main") },
        ]);
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingHorizontal: 18 * scale,
                        paddingBottom: 40 * scale,
                    },
                ]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={{ marginTop: 70 * scale, marginBottom: 50 * scale }}>
                    <Text style={[styles.title, { fontSize: 30 * scale }]}>초기 설정</Text>
                </View>

                <PixelCard title="디바이스 등록" scale={scale}>
                    <Text style={[styles.label, { fontSize: 15 * scale }]}>디바이스 ID</Text>
                    <PixelInput
                        scale={scale}
                        value={deviceId}
                        onChangeText={setDeviceId}
                        placeholder="예: SSUK-0001"
                        returnKeyType="next"
                    />
                </PixelCard>

                <View style={{ height: 30 * scale }} />

                <PixelCard title="식물 등록" scale={scale}>
                    <Text style={[styles.label, { fontSize: 15 * scale }]}>식물 닉네임</Text>
                    <PixelInput
                        scale={scale}
                        value={plantNick}
                        onChangeText={setPlantNick}
                        placeholder="예: 도망이"
                        returnKeyType="next"
                    />
                    <View style={{ height: 12 * scale }} />
                    <Text style={[styles.label, { fontSize: 15 * scale }]}>식물 종류</Text>
                    <PixelInput
                        scale={scale}
                        value={plantType}
                        onChangeText={setPlantType}
                        placeholder="예: 토마토"
                        returnKeyType="done"
                    />
                </PixelCard>

                <View style={{ height: 22 * scale }} />
                <PixelButton
                    label="등록 완료하고 시작하기"
                    onPress={onSubmit}
                    scale={scale}
                    enabled={canSubmit}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

/* ---------------- 픽셀 컴포넌트들 ---------------- */

function PixelCard({
                       title,
                       children,
                       scale,
                   }: {
    title: string;
    children: React.ReactNode;
    scale: number;
}) {
    const ps = Math.max(3, Math.round(PIXEL_SIZE * (scale >= 2 ? 1 : 1)));
    return (
        <View style={[styles.pixelCardWrap, { marginHorizontal: ps * 2 }]}>
            <PixelFrame color={GREEN} pixel={ps} />
            <View style={[styles.pixelCardInner, { padding: 14 * scale }]}>
                <Text style={[styles.cardTitle, { fontSize: 20 * scale }]}>{title}</Text>
                {children}
            </View>
        </View>
    );
}

function PixelInput({ scale, ...props }: any) {
    const ps = Math.max(3, Math.round(PIXEL_SIZE * (scale >= 2 ? 1 : 1)));
    return (
        <View style={[styles.pixelInputWrap, { marginHorizontal: ps * 2 }]}>
            <PixelFrame color={GREEN} pixel={ps} />
            <TextInput
                {...props}
                style={[styles.input, { fontSize: 18 * scale }]}
                placeholderTextColor="#A6B79D"
            />
        </View>
    );
}

function PixelButton({
                         label,
                         onPress,
                         scale,
                         enabled,
                     }: {
    label: string;
    onPress: () => void;
    scale: number;
    enabled: boolean;
}) {
    const ps = Math.max(3, Math.round(PIXEL_SIZE * (scale >= 2 ? 1 : 1)));

    const frameColor = enabled ? GREEN : BTN_DISABLED_FRAME;
    const fillColor = enabled ? LIGHT_GREEN : BTN_DISABLED_FILL;

    return (
        <Pressable
            onPress={onPress}
            disabled={!enabled}
            style={({ pressed }) => [
                { opacity: !enabled ? 0.6 : pressed ? 0.92 : 1 },
            ]}
        >
            <View style={[styles.pixelBtnWrap, { marginHorizontal: ps * 2 }]}>
                <PixelFrame color={frameColor} pixel={ps} />
                {/* ✅ 핵심 수정 부분: marginHorizontal: -ps
                    프레임이 바깥쪽(-ps * 2)으로 나가 있기 때문에,
                    배경색 뷰를 음수 마진으로 늘려서 틈새를 메웁니다.
                */}
                <View style={[styles.pixelBtnFill, { backgroundColor: fillColor, marginHorizontal: -ps }]}>
                    <Text style={[styles.btnText, { fontSize: 16 * scale }]}>{label}</Text>
                </View>
            </View>
        </Pressable>
    );
}

function PixelFrame({ color, pixel }: { color: string; pixel: number }) {
    const p = pixel;
    return (
        <>
            <View style={[styles.pTop, { height: p, left: p, right: p, top: -p, backgroundColor: color }]} />
            <View style={[styles.pBottom, { height: p, left: p, right: p, bottom: -p, backgroundColor: color }]} />
            <View style={[styles.pLeft, { width: p, top: p, bottom: p, left: -p * 2, backgroundColor: color }]} />
            <View style={[styles.pRight, { width: p, top: p, bottom: p, right: -p * 2, backgroundColor: color }]} />

            <View style={[styles.pCorner, { width: p, height: p, top: 0, left: -p, backgroundColor: color }]} />
            <View style={[styles.pCorner, { width: p, height: p, top: -p, left: 0, backgroundColor: color }]} />
            <View style={[styles.pCorner, { width: p, height: p, top: p, left: -p * 2, backgroundColor: color }]} />

            <View style={[styles.pCorner, { width: p, height: p, top: 0, right: -p, backgroundColor: color }]} />
            <View style={[styles.pCorner, { width: p, height: p, top: -p, right: 0, backgroundColor: color }]} />
            <View style={[styles.pCorner, { width: p, height: p, top: p, right: -p * 2, backgroundColor: color }]} />

            <View style={[styles.pCorner, { width: p, height: p, bottom: 0, left: -p, backgroundColor: color }]} />
            <View style={[styles.pCorner, { width: p, height: p, bottom: -p, left: 0, backgroundColor: color }]} />
            <View style={[styles.pCorner, { width: p, height: p, bottom: p, left: -p * 2, backgroundColor: color }]} />

            <View style={[styles.pCorner, { width: p, height: p, bottom: 0, right: -p, backgroundColor: color }]} />
            <View style={[styles.pCorner, { width: p, height: p, bottom: -p, right: 0, backgroundColor: color }]} />
            <View style={[styles.pCorner, { width: p, height: p, bottom: p, right: -p * 2, backgroundColor: color }]} />
        </>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    scrollContent: { paddingTop: 0 },
    title: {
        textAlign: "center",
        fontFamily: "NeoDunggeunmoPro-Regular",
        color: "#000000",
        letterSpacing: 1,
    },
    label: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        color: GREEN,
        marginBottom: 8,
        marginLeft: 4,
    },
    cardTitle: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        color: GREEN,
        marginBottom: 12,
        marginLeft: 2,
    },
    pixelCardWrap: {
        position: "relative",
        backgroundColor: "#FFFFFF",
    },
    pixelCardInner: {
        backgroundColor: "#FFFFFF",
    },
    pixelInputWrap: {
        position: "relative",
        height: 44,
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 18,
    },
    input: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        color: GREEN,
        paddingVertical: 0,
        zIndex: 10,
    },
    pixelBtnWrap: {
        position: "relative",
        height: 35,
        justifyContent: "center",
    },
    pixelBtnFill: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    btnText: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        color: "#FFFFFF",
        letterSpacing: 1,
    },
    pTop: { position: "absolute", zIndex: 5 },
    pBottom: { position: "absolute", zIndex: 5 },
    pLeft: { position: "absolute", zIndex: 5 },
    pRight: { position: "absolute", zIndex: 5 },
    pCorner: { position: "absolute", zIndex: 6 },
});