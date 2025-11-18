### NESTJS에서 Provider 이란?

- **"기능 제공자"**, **"NestJS에서 의존성을 주입할 수 있는 모든 클래스"**
- NestJS 코드를 작성할 때 가장 많이 작성하는 것들, 바로 Service, Repository, 클라이언트(HttpClient, RedisClient), 커스텀 클래스 들이 있을 것이다.
- 바로 이런 모든 **기능 제공자** 들을 하나의 개념으로 묶어둔 것을 Provider 이라고 한다.
- Service
- Repository
- Factory Provider
- Value Provider
- Class Provider
- Custom Provider
- 이 모든 것들은 Provider라는 큰 개념 아래에 들어간다.

#### 왜 존재하는가 ?

- NestJS의 근간은 **DI**(Dependency Injection)이다.
- Provider 라는 개념이 있어야 Nest가 객체를 스스로 생성 및 관리하고 필요한 곳에 자동으로 넣어줄 수 있게된다.
- new 없이 객체를 생성하고
- 재사용성을 높이고
- 테스트(mocking)가 쉬워지고
- 결합도를 낮추고
- 아키텍처가 계층적으로 깔끔해짐
- 이러한 장점을 가져다주는 핵심 개념이 Provider이다.
- 서비스가 커질수록 이 Provider 구조는 엄청난 힘을 발휘하게 된다.

#### Injectable() 데코레이터

- Injectable() 데코레이터를 붙인 클래스는 Provider로 사용할테니, DI 컨테이너가 관리해줘 라는 의미이다.
- 즉, Injectable() 데코레이터를 붙인 클래스는 다른 곳에서 의존성으로 주입받을 수 있는 대상이된다.
- NestJS의 DI 시스템은 리플렉션(메타데이터) 기반인데, TypeScript는 컴파일 시점에 타입 정보를 잃어버린다.
- 그래서 이 클래스가 주입 가능한 Provider인지 NestJS는 알 수 없는 것이다.
- 그래서! @Injectable() 데코레이터를 붙이면 Nest는 클래스의 의존성 정보를 메타데이터로 읽어 DI 컨테이너에 등록하게 되는 것이다.
