plugins {
	id("org.jetbrains.kotlin.jvm") version "1.1.2-2"
}

repositories {
	jcenter()
	maven { setUrl("http://dl.bintray.com/ethereum/maven") }
}

dependencies {
	testCompile(kotlinModule(module = "stdlib"))
	testCompile(kotlinModule(module = "test-junit"))
	testCompile(group = "junit", name = "junit", version = "4.12")
	testCompile(group = "org.ethereum", name = "ethereumj-core", version = "1.5.0-RELEASE")
	testCompile(group = "org.ethereum", name = "solcJ-all", version = "0.4.10")
}

the<JavaPluginConvention>().sourceSets.getByName("test").java.setSrcDirs(arrayListOf(file("tests")))
the<JavaPluginConvention>().sourceSets.getByName("test").resources.setSrcDirs(arrayListOf(file("contracts")))
