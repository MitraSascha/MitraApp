"""
RAGflow Chat Proxy — SSE Streaming (async für ASGI/uvicorn).
"""
import json
import re
import httpx
from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_view(request):
    """
    POST /api/wissen/chat/
    Body: {"frage": "...", "session_id": "optional"}
    """
    frage = request.data.get('frage', '').strip()
    session_id = request.data.get('session_id')

    if not frage:
        return Response({'error': 'frage fehlt'}, status=status.HTTP_400_BAD_REQUEST)

    if not settings.RAGFLOW_URL or not settings.RAGFLOW_API_KEY or not settings.RAGFLOW_CHAT_ID:
        return Response(
            {'error': 'RAGflow nicht konfiguriert'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    async def stream_generator():
        ragflow_url = (
            f"{settings.RAGFLOW_URL}/api/v1/chats"
            f"/{settings.RAGFLOW_CHAT_ID}/completions"
        )
        headers = {
            'Authorization': f'Bearer {settings.RAGFLOW_API_KEY}',
            'Content-Type': 'application/json',
        }
        body: dict = {'question': frage, 'stream': True}
        if session_id:
            body['session_id'] = session_id

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream('POST', ragflow_url, json=body, headers=headers) as response:
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': f'RAGflow Fehler {response.status_code}'})}\n\n"
                        return

                    prev_answer = ''

                    async for line in response.aiter_lines():
                        if not line or not line.startswith('data:'):
                            continue
                        payload_str = line[5:].lstrip()
                        try:
                            chunk = json.loads(payload_str)
                        except json.JSONDecodeError:
                            continue

                        if chunk.get('code', -1) != 0:
                            yield f"data: {json.dumps({'error': chunk.get('message', 'RAGflow Fehler')})}\n\n"
                            return

                        data = chunk.get('data')

                        # Final chunk: data == true signals completion
                        if data is True:
                            yield 'data: [DONE]\n\n'
                            return

                        if not isinstance(data, dict):
                            continue

                        # Send session_id once on first chunk
                        new_sid = data.get('session_id', '')
                        if new_sid and not session_id:
                            yield f"data: {json.dumps({'session_id': new_sid})}\n\n"

                        # answer is cumulative — compute delta (strip ##N$$ citation markers)
                        raw_answer = data.get('answer', '')
                        clean_answer = re.sub(r'##\d+\$\$', '', raw_answer)
                        delta = clean_answer[len(prev_answer):]
                        prev_answer = clean_answer

                        if delta:
                            yield f"data: {json.dumps({'text': delta})}\n\n"

                        # Send reference/sources when available (populated in last content chunk)
                        chunks = data.get('reference', {}).get('chunks') or []
                        if chunks:
                            quellen = [
                                {
                                    'dokument': c.get('document_name', ''),
                                    'snippet':  c.get('content', '')[:200],
                                    'score':    round(float(c.get('similarity', 0)), 2),
                                }
                                for c in chunks
                                if c.get('document_name')
                            ]
                            if quellen:
                                yield f"data: {json.dumps({'quellen': quellen})}\n\n"

        except httpx.TimeoutException:
            yield f"data: {json.dumps({'error': 'Timeout'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        yield 'data: [DONE]\n\n'

    resp = StreamingHttpResponse(
        stream_generator(),
        content_type='text/event-stream',
    )
    resp['Cache-Control'] = 'no-cache'
    resp['X-Accel-Buffering'] = 'no'
    return resp
