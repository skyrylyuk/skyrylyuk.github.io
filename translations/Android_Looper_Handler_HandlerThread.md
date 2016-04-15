Розуміння Android/Java процесів та потоків та зв`язаних понять
==========================================

Дання статья є перекладом [Understanding Android/Java Processes and Threads Related Concepts](http://codetheory.in/android-handlers-runnables-loopers-messagequeue-handlerthread/)


В цій статті ми спробуємо поверхнево оглянути різного роду низькорівнені поняття у Android які дійсно важливі для розуміння IMHO. Після того, як у вас сформується гарне уявлення про них, багато речей, які насправді побудовані на основі цих понять стане набагато легше зрозуміти і запрограмувати. Ми познайомимось з processes, threads, loopers, message queues, messages, handlers, runnables, та іншими. Я також буду вказувати на різні зовнішні ресурси, які ви обов'язково повинні подивитися для кращого розуміння.

Process
-------
