import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    SafeAreaView,
    Image,
} from "react-native";

const GREEN = "#2E5A35";
const LIGHT_GREEN = "#75A743";
const BG = "#EDEDE9";
const RED = "#D25353";

export default function ProfileScreen({ navigation }: any) {
    const nickname = "김농부";

    const onLogout = () => {
        Alert.alert("로그아웃", "로그아웃 하겠습니까?", [
            { text: "아니오", style: "cancel" },
            {
                text: "예",
                style: "destructive",
                onPress: () => {
                    Alert.alert("완료", "로그아웃 되었습니다.", [
                        {
                            text: "확인",
                            onPress: () => {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: "Login" }],
                                });
                            },
                        },
                    ]);
                },
            },
        ]);
    };

    const onWithdraw = () => {
        Alert.alert("탈퇴하기", "정말로 탈퇴하시겠습니까?", [
            { text: "아니오", style: "cancel" },
            {
                text: "예",
                style: "destructive",
                onPress: () => {
                    Alert.alert("탈퇴 처리", "탈퇴가 완료되었습니다.", [
                        {
                            text: "확인",
                            onPress: () => {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: "Login" }],
                                });
                            },
                        },
                    ]);
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.root}>
            {/* 상단 프로필 카드 */}
            <View style={styles.card}>
                <Image
                    source={require("../assets/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.nickname}>{nickname}</Text>
            </View>

            {/* 메뉴 영역 (사진처럼 섹션 단위로 라인) */}
            <View style={styles.menu}>
                <Line />
                <MenuRow
                    label="닉네임 변경하기"
                    onPress={() => navigation.navigate("NicknameChange")}
                />
                <MenuRow
                    label="비밀번호 변경하기"
                    onPress={() => navigation.navigate("PasswordChange")}
                />
                <Line />

                <MenuRow label="설정" onPress={() => navigation.navigate("Settings")} />
                <Line />

                <MenuRow label="로그아웃" onPress={onLogout} danger />
                <MenuRow label="탈퇴하기" onPress={onWithdraw} danger />
            </View>
        </SafeAreaView>
    );
}

function Line() {
    return <View style={styles.line} />;
}

function MenuRow({
                     label,
                     onPress,
                     danger = false,
                 }: {
    label: string;
    onPress: () => void;
    danger?: boolean;
}) {
    return (
        <Pressable onPress={onPress} style={styles.row}>
            <Text style={[styles.rowText, danger && styles.rowTextDanger]}>
                {label}
            </Text>
            <Text style={[styles.chevron, danger && styles.chevronDanger]}>›</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BG,
        paddingHorizontal: 26,
        paddingTop: 40,
    },

    /* 상단 카드 */
    card: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 34,
        marginBottom: 22,
    },

    logo: {
        width: 96,
        height: 96,
        marginBottom: 25,
    },

    nickname: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 30,
        color: "rgba(36,46,19,0.9)",
        letterSpacing: 1,
    },

    /* 메뉴 */
    menu: {
        backgroundColor: BG,
    },

    line: {
        height: 2,
        backgroundColor: GREEN,
        marginVertical: 10,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 18,
        paddingHorizontal: 6,
    },

    rowText: {
        flex: 1,
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 18,
        color: "rgba(36,46,19,0.9)",
    },

    chevron: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 22,
        color: "rgba(36,46,19,0.9)",
        opacity: 0.75,
        marginLeft: 10,
    },

    rowTextDanger: {
        color: RED,
    },
    chevronDanger: {
        color: RED,
        opacity: 1,
    },
});
