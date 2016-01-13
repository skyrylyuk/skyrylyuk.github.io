
Ефективне використання OkHttp
=================

Дання статья є перекладом [Effective OkHttp](http://omgitsmgp.com/2015/12/02/effective-okhttp/)

[OkHttp](http://square.github.io/okhttp/) був безціною библиотекой коли розроблявся Android додаток для [Khan Academy](https://www.khanacademy.org/). В той час, як пропонуєма конфігурація за замовчуванням є достатьо зручною у вкористанні річю, Нижче наведені деякі кроки, які допоможуть Вам стати більш продуктивним та досвідченим з OkHttp.

#### 1. Включить кеширование ответов на файловой системе

За замовчуванням, OkHttt не кешує відповіді які дозвілині для кешування шляхом включення HTTP `Cache-Control` заголовку. Тому ваш кліент може витрачати час та мережу запитуючи один і той самий ресурс знову і знову, а не просто прочитати копію збережену  після першого запиту.

Щоб включити кешування на файловій системі, необхідно сконфігурувати `com.squareup.okhttp.Cache` об'єкт класу і передати його `setCache` методу вашого 'OkHttpClient' об'єкта. Ви маєте створити об'єкт класу `com.squareup.okhttp.Cache` з параметром `java.util.File` об'єкт якого є відображенням директорії та максимальний розмір кешу у байтах. Відповіді, які можуть бути в кеші, записуються в заданій директорії. Якщо кешування відповідей викликає перевищуння об'єму каталогу заданий розмір, відповіді виселяють дотримуючись політики [LRU](https://en.wikipedia.org/wiki/Cache_algorithms#LRU).


За [рекомендацією Jesse Wilson](http://stackoverflow.com/a/32752861/400717), відповіді зберігаються у піддіректорії `context.getCacheDir()`:

``` java
// Base directory recommended by http://stackoverflow.com/a/32752861/400717.
// Guard against null, which is possible according to
// https://groups.google.com/d/msg/android-developers/-694j87eXVU/YYs4b6kextwJ and
// http://stackoverflow.com/q/4441849/400717.
final @Nullable File baseDir = context.getCacheDir();
if (baseDir != null) {
  final File cacheDir = new File(baseDir, "HttpResponseCache");
  okHttpClient.setCache(new Cache(cacheDir, HTTP_RESPONSE_DISK_CACHE_MAX_SIZE));
}
```

У додатку Khan Academy, ми визначили `HTTP_RESPONSE_DISK_CACHE_MAX_SIZE` розміром `10 * 1024 * 1024`, що є еквівалентно 10 MB.

#### 2. Інтеграція з Stetho.

[Stetho](http://facebook.github.io/stetho/) це прекрасна бібліотека від Facebookщо дає вам можливість іспектувати ваш Android додаток використовуючи [Chrome Developer Tools](https://developers.google.com/web/tools/setup/workspace/setup-devtools) інструменти Chrome.

На додаток до можливості іспектувати SQLite базу даних та іерархію view компонентів вашого додатку, Stetho надає вам можливість іспектувати кожен запіт або відповідь зроблений з використанням OkHttp.

Такий самоаналіз є дуже корисним, для того щоб переконатися, що сервер повертає HTTP заголовки, які дозволяють кешування ресурсів, а також перевірка того, що жодних запитів не виконується якщо існує закешований ресурс.

Щоб включити Stetho, просто додайте об'єкт класу `StethoInterceptor` до списку мережевих іспекцій
```java
okHttpClient.networkInterceptors().add(new StethoInterceptor());
```

Потім, після запуску програми, необхідно відкрити Chrome і перейти за адресою `chrome://inspect`. Ідентифікатори пристроїв та додатків мають бути відображені у списку. Перейшов по його **inspect**  посиланню - відкриє *Developer Tools*, а потім відкрийте вкладку **Network**, щоб розпочати моніторинг запитів виконаних за допомогою OkHttp.

#### 3. Використовуете ваш кліет з Picasso and Retrofit

Якщо Ви використовуєте [Picasso](http://square.github.io/picasso/) для завантаження зображень з мережі, або використовуєте [Retrofit](http://square.github.io/retrofit/) для спрошення створення запитів та декодування відповідей. За замовчуванням, ці бібліотеки наявно створюють свої власні `OkHttpClient` для внутрішнього використання, якщо явно не вказати зворотне. Приклад з класу `OkHttpDownloader` Picasso версія 2.5.2:
```java
private static OkHttpClient defaultOkHttpClient() {
  OkHttpClient client = new OkHttpClient();
  client.setConnectTimeout(Utils.DEFAULT_CONNECT_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS);
  client.setReadTimeout(Utils.DEFAULT_READ_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS);
  client.setWriteTimeout(Utils.DEFAULT_WRITE_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS);
  return client;
}
```

Retrofit має схожий фабрічний метод для створення власного `OkHttpClient`.

Деякі зображення є найбільшими з ресурсив, які Ваш додаток буде завантажувати. Picasso має підтримку власно LRU кешу для зображень, проте це строго у пам'яті. Якщо кліент намагається завантажити зображення, використовуючи Picasso, і Picasso не може знайти зоюраження у своему кеши у пам'яті, то завантаження цього зображення буде делеговано своєму внутрішньому `OkHttpClient` екземпляру. І за замовчуванням, цей екземпляр буде завжди завантажувати це зображення з серверу, так як вище вказаний метод `defaultOkHttpClient`створює екземпляр не налаштований для роботи з кешем відповідей на файловій системі.  

Використання власного кастомізованого екземпляру `OkHttpClient` доволяє повертати відповіді кешовані на файловій системі. В цьому випадку забраження не будуть завантажувати з серверу. Це особливо важливо, після того як додаток був запущений перший раз. У цей час Picasso in-memory кеш є холодним(порожній), отже він буде делегувати завантаження зображень екземпляру `OkHttpClient` частіще.

Уникнення такої ситуації, вимагає створення екземпляра Picasso, із налаштованим `OkHttpClient`. Якщо для завантаження зображення використовується `Picasso.with(context).load(...)`, що означає використання Picasso сінгелтона, з лінивою ініціалізаціє та налаштованим за замовчуванням власним екзампляром `OkHttpClient` методом `with(context)`. Тому необхідно створити свій екземпляр 'Picasso', як сінглтон, до першого виклику `with(context)`.

Для цього, необхідно обгорнути екземпляр `OkHttpClient` у `OkHttpDownloader`, і передати його методу `downloader` екземпляра `Picasso.Builder`:
```java
final Picasso picasso = new Picasso.Builder(context)
    .downloader(new OkHttpDownloader(okHttpClient))
    .build();

// The client should inject this instance whenever it is needed, but replace the singleton
// instance just in case.
Picasso.setSingletonInstance(picasso);
```

Для використання екземпляра `OkHttpClient` разом з `RestAdapter` у Retrofit 1.9.x, обгорніть `OkHttpClient` у екземпляр класа `OkClient` та передайте методу `setClient` екземпляру `RestAdapter.Builder`

```java
restAdapterBuilder.setClient(new OkClient(httpClient));
```

У Retrofit 2.0, просто передайте екзепляр класа `OkHttpClient` у метод `client` екземпляру `RestAdapter.Builder`.

У додатку  Khan Academy, що було взято за приклад, був використаний [Dagger](http://square.github.io/dagger/) для того щоб лише один екземпляр класу `OkHttpClient`, і щоб саме він використовувався і Picasso і Retrofit. Був реалізований провайдер для екземпляру `OkHttpClient` помічений анотацією @Singleton.

```java
@Provides
@Singleton
public OkHttpClient okHttpClient(final Context context, ...) {
  final OkHttpClient okHttpClient = new OkHttpClient();
  configureClient(okHttpClient, ...);
  return okHttpClient;
}
```

Потім цей екзепляр класу `OkHttpClient` за допомогою Dagger вводився в інші провайдери, які відповідали за створення екзеплярів RestAdapter та Picasso.

#### 4. Налаштування перехоплювача user agent-а

Логи та аналітика може бути набагато інформативніші, якщо кліенти надають будуть докладну інформацію у загаловку User-Agent у кожному запиті. За замовчуванням, OkHttp до заголовку User-Agent лише значення версії OkHttp. Для того щоб змінити значення у загаловку User-Agent, необхідно створити перехоплювач, який буде змінювати значення [відподно до цієї відповіді на StackOverflow:](http://stackoverflow.com/a/27840834/400717)
```java
public final class UserAgentInterceptor implements Interceptor {
  private static final String USER_AGENT_HEADER_NAME = "User-Agent";
  private final String userAgentHeaderValue;

  public UserAgentInterceptor(String userAgentHeaderValue) {
    this.userAgentHeaderValue = Preconditions.checkNotNull(userAgentHeaderValue);
  }

  @Override
  public Response intercept(Chain chain) throws IOException {
    final Request originalRequest = chain.request();
    final Request requestWithUserAgent = originalRequest.newBuilder()
        .removeHeader(USER_AGENT_HEADER_NAME)
        .addHeader(USER_AGENT_HEADER_NAME, userAgentHeaderValue)
        .build();
    return chain.proceed(requestWithUserAgent);
  }
}
```

Для того щоб зконструювати значення загаловку User-Agent, яке буде передаватися у конструктор UserAgentInterceptor, Ви можете використовувати все, що Ви вважаєте цінним. Ми викориристовуємо:
* Значення `os` `Android`, щоб чітко повідомити, що це Android-пристрої
* `Build.MODEL`
* `Build.BRAND`
* `Build.VERSION.SDK_INT`
* `BuildConfig.APPLICATION_ID`
* `BuildConfig.VERSION_NAME`
* `BuildConfig.VERSION_CODE`

Останні три значення задаються значення `applicationId`, `versionCode` та `versionName` у файлі Gradle сценарія. Для отримання більш детальної інформації, зверніться документації з питань [версіонування Вашаго додатку](http://developer.android.com/tools/publishing/versioning.html) та [налаштуванні applicationID з Gradle](http://tools.android.com/tech-docs/new-build-system/applicationid-vs-packagename).

#### 4. Обгрунтоване налаштування timeouts

До версії 2.5.0, OkHttp за замовчуванням ніколи не закривав з'єднання через закунчення часу очікування(timeout). Починаючи з версії 2.5.0, час очікування на встановлення з'єднання, читання наступного байту із з'єднання чи запис наступного байту у з'єднання може тривати не більше 10 секунд (будь-яка з вище зазначених операцій має завершитися успіхом за відведений час). Щоб змінити ці значення за замовчуванням, використовуйте `setConnectTimeout`, `setReadTimeout` чи `setWriteTimeout` відповідно.

Зверніть увагу, що Picasso та Retrofit використовують різні значення для своїх екзеплярів `OkHttpClient` створених за замовчуванням.
За замовчуванням, Picasso визначає:
* Timeout на підключення становить 15 секунд
* Timeout на читання становить 20 секунд
* Timeout на запис становить 20 секунд

У той час як Retrofit, визначає:
* Timeout на підключення становить 20 секунд
* Timeout на читання становить 20 секунд
* Timeout на запис відсутній

Налаштувавши Picasso та Retrofit через власний екземпляр `OkHttpClient` ви можете забезпечити однакові значення timeout-ів для всіх запитів.

#### Висновки

Знову ж, OkHttp пропонує досить зручну конфігурацію за замовчуванням. Виконавши  описані вище дії, Ви зможете стати більш продуктивним та досвідченим, і поліпшити якість вашого додатка.
