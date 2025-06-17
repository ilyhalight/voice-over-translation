Contains the implementation for extracting the audio track from a YouTube video to send it to Yandex. Used only when the server explicitly requests audio.

It's worth checking the original implementation from time to time — other extraction methods might be worth implementing too.

Implemented:

- `web_api_get_all_generating_urls_data_from_iframe`

Broken in yabrowser:

- `web_api_slow`
- `web_api_steal_sig_and_n`
