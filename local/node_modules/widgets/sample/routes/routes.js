module.exports = {
	homePage: "/",
	userPage: {
		pattern: "/user/(int:id)/(slug:name).html",
		action: "userPage",
	}
}
