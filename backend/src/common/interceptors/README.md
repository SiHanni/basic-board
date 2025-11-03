## CallHandler

- 왜 쓰는가: 컨트롤러가 리턴한 값을 다음 단계로 넘기는 핸들러를 표현합니다. Interceptor는 여기서 반환 스트림을 가로채 변형합니다.

- 왜 이걸 썼는가: next.handle()이 Observable 스트림을 반환하므로, 그 스트림에 연산자를 붙여 응답을 래핑하려고요.

- 왜 알아야 하는가: Interceptor의 본질은 “컨트롤러 결과의 스트림 가공”이므로, CallHandler를 이해해야 RX 체인을 안전하게 바꿀 수 있습니다.

- 관련 기술: Express 미들웨어(요청/응답 가로채기), Nest Interceptor 체인, RxJS Observable.

## ExecutionContext

- 왜 쓰는가: 현재 실행 중인 컨텍스트(HTTP/RPC/WS)를 추상화해, HTTP 객체에 접근할 수 있게 합니다.

- 왜 이걸 썼는가: switchToHttp().getRequest()로 요청 경로(req.url)를 꺼내 **meta.path**에 넣기 위해서입니다.

- 왜 알아야 하는가: 동일 Interceptor를 gRPC/WS에서 재사용하려면 컨텍스트 전환을 이해해야 해요.

- 관련 기술: ArgumentsHost(Filter에서 쓰던 것), ExecutionContext(Interceptor/Guard 등), switchToRpc(), switchToWs().

## Injectable

- 왜 쓰는가: 이 클래스가 DI 컨테이너로 관리되는 프로바이더임을 선언합니다.

- 왜 이걸 썼는가: Interceptor를 전역 또는 컨트롤러/핸들러 단위로 주입/등록하려면 Nest 프로바이더여야 합니다.

- 왜 알아야 하는가: DI 수명주기/스코프를 모르면 전역 등록, 테스트 주입, 모듈 바인딩 시 문제가 생깁니다.

- 관련 기술: @Injectable(), 모듈 프로바이더 등록, 전역 Interceptor 등록.

## NestInterceptor

- 왜 쓰는가: Interceptor의 **계약(인터페이스)**입니다. intercept(context, next) 시그니처를 강제합니다.

- 왜 이걸 썼는가: Nest가 이 클래스를 Interceptor로 인식하고 체인에 연결하려면 구현해야 합니다.

- 왜 알아야 하는가: Guard/Filter/Pipe/Interceptor의 책임선을 분명히 구분해야, 응답 가공은 Interceptor, 예외 처리(Filter), 인가(Guard), 입력 검증(Pipe)로 역할이 안 섞입니다.

- 관련 기술: AOP(횡단 관심사), 성공 응답 변환 vs 에러 응답 변환(Filter).

## map (from rxjs/operators)

- 왜 쓰는가: 컨트롤러 반환값의 스트림을 변환합니다. 여기서는 data를 표준 성공 바디로 래핑.

- 왜 이걸 썼는가: 동기/비동기/Promise/Observable 모든 반환이 최종적으로 Observable로 래핑되므로, map 하나로 일괄 변환이 가능합니다.

- 왜 알아야 하는가: RX 체인을 모르면 파일 스트림/서버센트 이벤트 같은 특수 응답에서 잘못된 래핑으로 기능을 깨뜨릴 수 있습니다.

- 관련 기술: tap(로그/부수효과), catchError(스트림 에러 가로채기—단, 에러는 보통 Filter에게), switchMap(비동기 변환).
