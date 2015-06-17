var IS_XS = $(document).width() < 768 ? true : false;
var IS_SM = $(document).width() >= 768 && $(document).width() < 992 ? true : false;
var IS_MD = $(document).width() >= 992 && $(document).width() < 1200 ? true : false;
var IS_LG = $(document).width() >= 1200;

var searchTimeoutHandle;

var ViewModel = {
    AddedTags: ko.observableArray([]),                  // these are the tags that show with the red X next to them
    ClickablePageNumbers: ko.observableArray([]),       // array to store the clickable pagination pages at the bottom (includes the ... if needed)
    MobilePageNumberString: ko.observable(),
    PaginationLastPageNumber: ko.observable(0),         // last page number in pagination
    PaginationPrevVisible: ko.observable(true),
    PaginationNextVisible: ko.observable(true),
    SearchResultsPerPage: ko.observable(5),            // number of search results to show per page dropdown
    SelectedPageNumber: ko.observable(0),               // selected pagination number (changes on click)
    SelectedTags: ko.observableArray([]),               // tags that are checked
    SelectedDivisions: ko.observableArray([]),          // divisions that are checked
    SearchResultsItems: ko.observableArray([]),         // JSON data that comes back from search
    TotalNumberSearchResults: ko.observable(0),         // total number of items in db - used for generating pagination
    SearchString: ko.observable(),                      // the search string - located within the searchbox
    PageLoadInit: function () {
        this.HidePagination();                          // hide pagination initially
        this.PopulatePassedSearchString();              // populate the search bar with any search string passed
        this.PopulatePassedDivision();                  // check for passed divisions and automatically check corresponding checkboxes and populate the AJAX array
        this.GenerateTagArray();                        // generate at least an empty array
        //if query passed from another page - run search
        if (location.search != "") {
            ViewModel.DoAjax(false);
        }
    },
    SearchByDivision: function (guid) {                 // when someone clicks a division hyperlink
        this.SelectedPageNumber(0);                     //go to first page
        this.SelectedDivisions = [];
        this.SelectedDivisions.push(this.NormalizeGuid(guid));
        this.ApplyDivisionChecks();
        this.ClearAllTags();
        this.DoAjax(true);
    },
    SearchByTag: function (guid) {                      // when someone clicks a tag hyperlink
        this.SelectedPageNumber(0);                     //go to first page
        this.SelectedTags = [];
        this.SelectedTags.push(this.NormalizeGuid(guid));
        this.CheckAllDivisions();
        this.GenerateDivisionArray();
        this.MoveTagFromDropdown(this.NormalizeGuid(guid));
        this.DoAjax(true);
    },
    UpdateSelectedPageNumber: function (pagenumber) {   // if a user clicks on a pagination button
        if (!isNaN(pagenumber)) {
            this.SelectedPageNumber(pagenumber);
            this.DoAjax(false);
        }
    },
    PrevPage: function () {
        this.SelectedPageNumber(this.SelectedPageNumber() - 1);
        this.DoAjax(false);
    },
    NextPage: function () {
        this.SelectedPageNumber(this.SelectedPageNumber() + 1);
        this.DoAjax(false);
    },
    GenerateSearchResultCountString: function () {  // this outputs the string shown under the search bar for # of results and what was searched for
        var appendedS = (this.TotalNumberSearchResults() === 0 || this.TotalNumberSearchResults() > 1) ? RG_SEARCH_COUNT_PLURAL : "";
        return this.TotalNumberSearchResults() + ' ' + RG_SEARCH_COUNT + appendedS + ' ' + RG_SEARCH_COUNT_PREPOSITION + ' ' + '"' + this.SearchString() + '"';
    },
    PopulatePassedDivision: function () {
        this.SelectedDivisions = [];
        var PassedDivision = this.ParseQueryStringParams()['Division']; //this is case sensitive

        // if no division is passed, check all the division checkboxes
        if (PassedDivision == null) {
            this.CheckAllDivisions();
        } else {
            this.SelectedDivisions = PassedDivision.split("|");
            this.ApplyDivisionChecks();
        }

        this.GenerateDivisionArray(); // populate AJAX array based on number of checked divisions
    },
    CheckAllDivisions: function () {
        $(".regular-checkbox").each(function () {
            $(this).prop("checked", true);
        });
    },
    UncheckAllDivisions: function () {
        $(".regular-checkbox").each(function () {
            $(this).attr("checked", false);
        });
    },
    ApplyDivisionChecks: function () {
        this.UncheckAllDivisions();
        for (var i = 0; i < this.SelectedDivisions.length; i++) { // check only passed divisions
            $("#divisions-checkbox-" + this.SelectedDivisions[i]).prop("checked", true);
        }
    },
    PopulatePassedSearchString: function () {
        if (typeof this.ParseQueryStringParams()['searchText'] != 'undefined') {
            this.SearchString(this.ParseQueryStringParams()['searchText']);
        } else {
            this.SearchString("");
        }
        $("#search-bar").val(this.SearchString()); // this is case sensitive
    },
    GetDivisionTitleByGuid: function (guid) {
        return DivisionMap["GUID_" + this.NormalizeGuid(guid)];
    },
    GetTagTitleByGuid: function (guid) {
        return TagMap["GUID_" + this.NormalizeGuid(guid)];
    },
    GenerateDivisionArray: function () { // resets AJAX division array based on checked divisions
        ViewModel.SelectedDivisions = [];
        $(".regular-checkbox:checked").each(function () {
            ViewModel.SelectedDivisions.push($(this).data('division-guid'));
        });
    },
    MoveTagFromDropdown: function (guid) {
        this.UnhideAllDropdownTags();
        $("#menudropdown-sidebar li a[data-value='" + guid + "'] input").prop("checked", true);
        $("#menudropdown-sidebar li a[data-value='" + guid + "']").parent().hide();
        this.GenerateDivisionArray();
        this.ShowAddedTags();
    },
    GenerateTagArray: function () { // resets AJAX tag array based on checked tags - occurs when user clicks "Add"
        this.SelectedTags = [];
        $("#menudropdown-sidebar li a input[type='checkbox']:checked").each(function () {
            ViewModel.SelectedTags.push($(this).parent().data("value"));
            $(this).parent().parent().hide();
        });

        this.ShowAddedTags();
    },
    ShowAddedTags: function () { // shows the added tags underneath tag drop down
        var CheckedTags = this.MapTags(this.SelectedTags);
        this.AddedTags(CheckedTags);
    },
    MapTags: function(tag_arr){
        return tag_arr.map(function (guid) {
            var title = ViewModel.GetTagTitleByGuid(guid);
            return { Guid: guid, Title: title };
        });
    },
    SortTags: function (guid_arr) {
        var MappedTags = this.MapTags(guid_arr);
        return MappedTags.sort(function (a, b) { return a.Title > b.Title ? 1 : -1 });
    },
    ResetTag: function (guid) { // happens when someone clicks the red X next to a tag
        ViewModel.SelectedPageNumber(0);
        this.SelectedTags.remove(guid);
        this.ShowAddedTags();
        $("#menudropdown-sidebar li a[data-value='" + guid + "'] input").attr('checked', false);
        $("#menudropdown-sidebar li a[data-value='" + guid + "']").parent().show();
        this.DoAjax(true);
    },
    ClearAllTags: function () {  // empties AJAX tag array, unchecks all tag checkboxes, and clears out all added tags underneath dropdown
        this.SelectedTags = [];
        this.UnhideAllDropdownTags();
        $("#filter-tags .division-checkboxes").fadeOut();
    },
    UnhideAllDropdownTags: function () {
        $("#menudropdown-sidebar li a input").each(function () {
            $(this).removeAttr('checked');
            $(this).parent().parent().show();
        });
    },
    UpdatePagination: function () {

        if (this.TotalNumberSearchResults() == 0)  // if no results, hide pagination
        {
            this.HidePagination();
            return false;
        }

        var ClickablePageNumbers = [];
        var NumberOfPageNumbers;
        var ExtraPageButtons = 2; //max number of buttons before or after current page

        var FirstPageNumber = 0;

        NumberOfPageNumbers = Math.ceil(ViewModel.TotalNumberSearchResults() / ViewModel.SearchResultsPerPage());  //rounds up if a remainder is present

        if (ViewModel.SelectedPageNumber() >= ExtraPageButtons)
            FirstPageNumber = ViewModel.SelectedPageNumber() - ExtraPageButtons;

        for (var i = FirstPageNumber; i <= (ViewModel.SelectedPageNumber() + ExtraPageButtons) & i < NumberOfPageNumbers; i++)
            ClickablePageNumbers.push(i + 1); //convert 0 to 1 since first page is 1 and not 0..etc

        if (this.SelectedPageNumber() == 0) // if we are on the first page, dont show prev
            this.PaginationPrevVisible(false);
        else
            this.PaginationPrevVisible(true);

        if (this.SelectedPageNumber() == NumberOfPageNumbers - 1) {  // if we are on last page, dont show next
            this.PaginationNextVisible(false);
        } else {
            this.PaginationNextVisible(true);
        }

        //add elipsis
        if (FirstPageNumber > 0) {
            if (this.SelectedPageNumber() > ExtraPageButtons + 1)
                ClickablePageNumbers.unshift("...");
            ClickablePageNumbers.unshift(1);
        }
        if (this.SelectedPageNumber() + ExtraPageButtons < NumberOfPageNumbers - 1) {
            if (this.SelectedPageNumber() + ExtraPageButtons < NumberOfPageNumbers - 2)
                ClickablePageNumbers.push("...");
            ClickablePageNumbers.push(NumberOfPageNumbers);
        }

        ViewModel.PaginationLastPageNumber(NumberOfPageNumbers); // update last page number (used for mobile page x of y)
        ViewModel.ClickablePageNumbers(ClickablePageNumbers);    // assign local var to ko observable
        ViewModel.MobilePageNumberString('page ' + (this.SelectedPageNumber() + 1) + ' of ' + this.PaginationLastPageNumber());
        ViewModel.HighlighActivePageNumber();

    },
    AllDivisionsAreEmpty: function () {  //checks all division checkboxes to see if they are empty
        return (!($(".regular-checkbox:checked").length > 0)) ? true : false;
    },
    NormalizeGuid: function (guid) {  // strips out any hyphens and UPPERCASEs everything
        return guid.replace(/-/g, "").toUpperCase();
    },
    ParseQueryStringParams: function () {
        var result = {}, queryString = location.search.slice(1),
                re = /([^&=]+)=([^&]*)/g, m;
        while (m = re.exec(queryString)) {
            result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        }
        return result;
    },
    HighlighActivePageNumber: function () {
        $('.page-numbers').removeClass('active');
        $('#paginated_' + (this.SelectedPageNumber() + 1)).addClass('active');
    },
    HidePagination: function () {
        $("#pagination").hide();
    },
    ShowPagination: function () {
        $("#pagination").show();
    },
    ShowLoadingGif: function(){
        $("#results-page-text").hide();
        $("#loading-gif").show();
    },
    HideLoadingGif: function(){
        $("#results-page-text").show();
        $("#loading-gif").hide();
    },
    DoAjax: function (delay) {

        if (this.AllDivisionsAreEmpty()) // prevents ajax of all divisions are empty
        {
            $(".search-return").hide();
            $("#no-results").show();
            this.HidePagination();
            this.TotalNumberSearchResults(0);
            if (searchTimeoutHandle != -1) //pending call
                clearTimeout(searchTimeoutHandle);
            this.HideLoadingGif();
            return false;
        } else {
            $(".search-return").show();
            this.ShowPagination();
            $("#no-results").hide();
        }

        this.SearchString($("#search-bar").val());

        this.ShowLoadingGif();

        var ajax = function () {

            $.ajax({
                url: "/RGSearch/DoSearch/",
                type: "GET",
                cache: false,
                dataType: "json",
                data: {
                    searchString: ViewModel.SearchString,
                    Divisions: ViewModel.SelectedDivisions,
                    Tags: ViewModel.SelectedTags,
                    page: ViewModel.SelectedPageNumber,
                    pageSize: ViewModel.SearchResultsPerPage
                },
                beforeSend: function () {
                },
                complete: function () {
                    ViewModel.HideLoadingGif();
                    searchTimeoutHandle = -1;
                },
                success: function (result) {
                    ViewModel.SearchResultsItems(result.Items);
                    ViewModel.TotalNumberSearchResults(parseInt(result.TotalSearchResults));
                    ViewModel.UpdatePagination();
                },
                failure: function (jqXHR) {
                    alert(jqXHR.statusText);
                }
            });
        }
        if (searchTimeoutHandle != -1) //pending call
            clearTimeout(searchTimeoutHandle);

        if (!delay)
            searchTimeoutHandle = setTimeout(ajax, 0); //immediately
        else
            searchTimeoutHandle = setTimeout(ajax, 500);

    }

}; // end ViewModel initialization

// apply ko bindings
ko.applyBindings(ViewModel);

// run all the things that need to run on page load
ViewModel.PageLoadInit();

/****** USER EVENT DRIVEN ITEMS BEGIN ******/

    $(document).ready(
        function () {

        // initialize
        if (IS_XS || IS_SM) {
            $(".sidebar-filters-options").hide();
            $(".sidebar-filters h4 a i").removeClass("glyphicon-triangle-top").addClass("glyphicon-triangle-right");
        }
        $('#search-bar').on("keypress", function (e) {
            if (e.which == 13) {
                $('#search-button').click();
            }
        });

        // number of search results dropdown "change"
        $("#dropdown-search-results-box li a").on("click", function (e) {
            ViewModel.SearchResultsPerPage(parseInt($(this).find("span").text()));
            ViewModel.SelectedPageNumber(0);
            $("#dropdown-search-results span").text(ViewModel.SearchResultsPerPage());
            e.preventDefault();
            if (ViewModel.TotalNumberSearchResults() > 0)
                ViewModel.DoAjax(false);
        });

        // when a division checkbox is checked, it updates the division array 
        $(".regular-checkbox").on("change", function () {
            ViewModel.SelectedPageNumber(0);
            ViewModel.GenerateDivisionArray();
            ViewModel.DoAjax(true);
        });

        // when the "Add" button is clicked is when we generate the TagArray based on their checked tags
        $("#add-button").on("click", function () {
            ViewModel.SelectedPageNumber(0);
            ViewModel.GenerateTagArray();
            ViewModel.DoAjax(true);
            event.preventDefault();
        });

        // clear all tags button click
        $("#clear-side-button").on("click", function () {
            ViewModel.SelectedPageNumber(0);
            ViewModel.ClearAllTags();
            ViewModel.DoAjax(true);
            event.preventDefault();
        });

        // search button is clicked - perform ajax
        $.ajaxSettings.traditional = true;
        $('#search-button').on('click', function (event) {
            ViewModel.SelectedPageNumber(0);
            ViewModel.SelectedPageNumber(0);//reset page number
            ViewModel.DoAjax(false);
        });

        // prevent tag drop down from closing when a checkbox is clicked inside
        $('#menudropdown-sidebar').on('click', function (event) {
            event.stopPropagation();
        });

        // when someone clicks the label in the tag drop down choose the associated checkbox
        $('#menudropdown-sidebar a').on('click', function (event) {
            $(this).children('input').prop("checked", true);
            event.stopPropagation();
            event.preventDefault();
        });

        // when someone clicks a checkbox in the tag drop down - check the checkbox - this won't work without this
        $('#menudropdown-sidebar a input').on('click', function (event) {
            $(this).prop("checked", true);
            event.stopPropagation();
        });

        //prevent it from jumping to top of page on click
        $('#prev-button, #next-button').on('click', function (event) {
            //event.preventDefault();
        });

        // accordian control
        $(".sidebar-filters h4 a").click(function () {

            if (IS_XS || IS_SM) {
                $this = $(this);
                $this.parent().next().slideToggle(500, function () {
                    if ($this.parent().next().is(":visible")) {
                        $this.find("i").removeClass("glyphicon-triangle-right").addClass("glyphicon-triangle-top");
                    }
                    else {
                        $this.find("i").removeClass("glyphicon-triangle-top").addClass("glyphicon-triangle-right");
                    }
                });
            }

            return false;
        });

        // for removing items from an array
        Array.prototype.remove = function () {
            var what, a = arguments, L = a.length, ax;
            while (L && this.length) {
                what = a[--L];
                while ((ax = this.indexOf(what)) !== -1) {
                    this.splice(ax, 1);
                }
            }
            return this;
        };
        //set dropdown to default items per page
        $("#dropdown-search-results span").text(ViewModel.SearchResultsPerPage());

    }); // end document ready