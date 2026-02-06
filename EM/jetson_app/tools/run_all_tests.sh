#!/bin/bash

PYTHON=python3
BASE_DIR=$(dirname "$(realpath "$0")")

echo "====================================="
echo "  STM32 HARDWARE INTEGRATION TEST"
echo "  (tools directory)"
echo "====================================="

run_test () {
    local name=$1
    local script=$2

    echo
    echo "-------------------------------------"
    echo "[TEST] $name"
    echo "-------------------------------------"
    echo "q 를 누르면 다음 테스트로 넘어갑니다."
    echo

    $PYTHON "$BASE_DIR/$script"

    echo
    echo "[DONE] $name"
    echo "Press Enter to continue..."
    read
}

run_test "SENSOR DATA TEST"   "data_req_test.py"
run_test "LED RELAY TEST"     "led_test.py"
run_test "WATER PUMP TEST"    "waterp_test.py"
run_test "NUTRI PUMP TEST"    "nutrip_test.py"

echo
echo "====================================="
echo " ALL TESTS FINISHED ✅"
echo "====================================="

