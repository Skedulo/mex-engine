#!/bin/sh

# default base url
DEFAULT_BASE_API_URL="https://dev-api.test.skl.io"

# default admin-console token for mexdev org
DEFAULT_ADMIN_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlB3aUNlVE1fNGtaUFpHZEtfR0szZSJ9.eyJodHRwczovL2FkbWluLnNrbC5pby9wZXJtaXNzaW9ucyI6WyJyZWFkOmRlcGxveW1lbnRzIiwiY3JlYXRlOmRlcGxveW1lbnRzIiwiZ2VuZXJhdGU6ZGItY3JlZGVudGlhbHMiLCJyZWFkOmt1YmVybmV0ZXMiLCJ1cGRhdGU6a3ViZXJuZXRlcyIsImNyZWF0ZTprdWJlcm5ldGVzIiwiZGVsZXRlOmt1YmVybmV0ZXMiLCJyZWFkOmFkbWluLWNvbnNvbGUiLCJjcmVhdGU6YWRtaW4tY29uc29sZSIsInVwZGF0ZTphZG1pbi1jb25zb2xlIiwiZGVsZXRlOmFkbWluLWNvbnNvbGUiLCJkZXZlbG9wOmFkbWluLWNvbnNvbGUiLCJhZG1pbmlzdGVyOmFkbWluLWNvbnNvbGUiLCJnZW5lcmF0ZTpkZXBsb3ltZW50cyJdLCJpc3MiOiJodHRwczovL3NrZWR1bG8taW50ZXJuYWwuYXUuYXV0aDAuY29tLyIsInN1YiI6Imdvb2dsZS1hcHBzfGh1eS52dUBza2VkdWxvLmNvbSIsImF1ZCI6WyJodHRwczovL2ludGVybmFsLWFwaS5wcm9kLnNrbC5pby8iLCJodHRwczovL3NrZWR1bG8taW50ZXJuYWwuYXUuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTY4MTM2OTQzOCwiZXhwIjoxNjgxNDE5ODM4LCJhenAiOiJhN1lNMTd3WlhKRUZ1REJRb3pyaHJEelVaMHNIdURWSiIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgb2ZmbGluZV9hY2Nlc3MifQ.SaI4_lXgj1wVlX3M8Sjbty6RMNNNhV_-KFOMJ37esCwydD1AtV2_0Yamf-kLhkqmK90ztU8FbgOUcC4JoeDu3xo4zoPLCcYkt_uMS3F9Ws0ThBsmKDYM1CD7qTBLSiHb9cTZq0wNMC1NV6OEmnCtiNo-3RS8uD4sMnrAvgpQhFJ8vDcRIdi2o9R61VFp9oUgp5S_KTu9JkSsyWQkS_v269chRXz1DlGnPfQ4A2l7-GvO-dgE_vnCZcU_C9O_eOw2QrcNyCTtXGiYEdVBDAdWZmtAKdS72BgXMejHnWZhRYNK4Y_U74h52QG6oxx-SIbPStuXCzYEIU6C6Sks0zJS3w"

helpFunction() {
  echo ""
  echo "Usage: $0 -u <BASE_API_URL> -m <MEX_VERSION> -a <APP_VERSION> -t <ADMIN_CONSOLE_TOKEN>"
  echo "\t-u BASE_API_RL if you want to upload engine to environment other than dev"
  echo "\t-m MEX_VERSION Engine version"
  echo "\t-a APP_VERSION App version"
  echo "\t-t ADMIN_CONSOLE_TOKEN Admin console token have permission to upload engine"
  exit 1 # Exit script after printing help
}

while getopts "u:t:a:m:" opt; do
  case "$opt" in
  u) BASE_API_URL="$OPTARG" ;;
  m) MEX_VERSION="$OPTARG" ;;
  a) APP_VERSION="$OPTARG" ;;
  t) ADMIN_CONSOLE_TOKEN="$OPTARG" ;;
  ?) helpFunction ;; # Print helpFunction in case parameter is non-existent
  esac
done

echo "ADMIN TOKEN $ADMIN_CONSOLE_TOKEN"

# Use DEFAULT_BASE_URL in case BASE_URL is not provided
if [ -z "$BASE_API_URL" ]; then
  BASE_API_URL=$DEFAULT_BASE_API_URL
fi

# Use DEFAULT_ADMIN_TOKEN in case TOKEN is not provided
if [ -z "$ADMIN_CONSOLE_TOKEN" ]; then
  ADMIN_CONSOLE_TOKEN=$DEFAULT_ADMIN_TOKEN
fi

echo "ENGINE_VERSION = $MEX_VERSION"
ANDROID_BUNDLE_FILE="android$MEX_VERSION.zip"
IOS_BUNDLE_FILE="ios$MEX_VERSION.zip"

# delete output folder if exists
# create folders: output > android/ios
if [ -d "output" ]; then rm -Rf "output"; fi
mkdir -p output/android
mkdir -p output/ios

# create android/ios bundle
npx react-native bundle --platform android --dev false --entry-file index.tsx --bundle-output output/android/index.bundle --assets-dest output/android
npx react-native bundle --platform ios --dev false --entry-file index.tsx --bundle-output output/ios/index.bundle --assets-dest output/ios

if [ $? -eq 0 ]; then
    echo "====Successfully Bundle====="
else
    echo "----Can't bundle-----"
    exit 1
fi

# zip and upload android bundle
BASEDIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BASEDIR/output/android"
echo "Zipping Android bundle"
zip -r "$ANDROID_BUNDLE_FILE" ./*

echo "---Uploading Android bundle"
CURL_OUTPUT=$(curl --location -g --request POST "$BASE_API_URL/form/engine/$MEX_VERSION/$APP_VERSION/android" \
  --header "Authorization: Bearer $ADMIN_CONSOLE_TOKEN" \
  --form "bundle=@\"./$ANDROID_BUNDLE_FILE\"")

if [ $CURL_OUTPUT = "{\"result\":\"${MEX_VERSION}_android.zip\"}" ]; then
  echo "\n====Successfully Upload Android bundle===="
else
    echo "\n----Can't Upload Android bundle-----"
    echo "$CURL_OUTPUT"
    exit 1
fi

# zip and upload ios bundle
cd "$BASEDIR/output/ios"

echo "---Zipping iOS bundle"
zip -r "$IOS_BUNDLE_FILE" assets index.bundle

echo "---Uploading iOS bundle"
CURL_OUTPUT=$(curl --location -g --request POST "$BASE_API_URL/form/engine/$MEX_VERSION/$APP_VERSION/ios" \
  --header "Authorization: Bearer $ADMIN_CONSOLE_TOKEN" \
  --form "bundle=@\"./$IOS_BUNDLE_FILE\"")

if [ $CURL_OUTPUT = "{\"result\":\"${MEX_VERSION}_ios.zip\"}" ]; then
  echo "\n====Successfully Upload iOS bundle===="
else
    echo "\n----Can't Upload iOS bundle-----"
    echo "$CURL_OUTPUT"
    exit 1
fi

